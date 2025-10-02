/**
 * 개선된 API 응답 처리 유틸리티
 * XML과 JSON 응답을 자동으로 감지하고 파싱
 */

import { XMLParser } from 'fast-xml-parser';

// XML 파서 설정
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true
});

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  responseType?: 'json' | 'xml';
  contentType?: string;
}

/**
 * API 응답을 자동으로 감지하고 파싱하는 함수
 */
export async function handleApiResponse(response: Response): Promise<ApiResponse> {
  try {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    // 빈 응답 체크
    if (!text.trim()) {
      return {
        success: false,
        error: 'Empty response received',
        responseType: 'json',
        contentType
      };
    }
    
    // XML 감지 로직 개선
    const isXmlResponse = 
      text.trim().startsWith('<?xml') || 
      text.trim().startsWith('<OpenAPI_S') ||
      text.trim().startsWith('<response') ||
      contentType.includes('xml') ||
      contentType.includes('text/xml') ||
      contentType.includes('application/xml');
    
    if (isXmlResponse) {
      console.log('🔄 XML 응답 감지, XML 파싱 진행');
      
      try {
        const xmlData = xmlParser.parse(text);
        
        return {
          success: true,
          data: xmlData,
          responseType: 'xml',
          contentType
        };
        
      } catch (xmlError) {
        console.error('❌ XML 파싱 실패:', xmlError);
        
        return {
          success: false,
          error: `XML parsing failed: ${xmlError instanceof Error ? xmlError.message : 'Unknown XML error'}`,
          responseType: 'xml',
          contentType
        };
      }
      
    } else {
      console.log('🔄 JSON 응답으로 추정, JSON 파싱 진행');
      
      try {
        const jsonData = JSON.parse(text);
        
        return {
          success: true,
          data: jsonData,
          responseType: 'json',
          contentType
        };
        
      } catch (jsonError) {
        console.error('❌ JSON 파싱 실패:', jsonError);
        
        // JSON 파싱 실패시 XML도 시도해보기
        console.log('🔄 JSON 파싱 실패, XML 파싱 재시도');
        
        try {
          const xmlData = xmlParser.parse(text);
          console.log('✅ XML 파싱으로 성공');
          
          return {
            success: true,
            data: xmlData,
            responseType: 'xml',
            contentType
          };
          
        } catch (xmlError2) {
          return {
            success: false,
            error: `Both JSON and XML parsing failed. JSON error: ${jsonError instanceof Error ? jsonError.message : 'Unknown'}, XML error: ${xmlError2 instanceof Error ? xmlError2.message : 'Unknown'}`,
            responseType: 'json',
            contentType
          };
        }
      }
    }
    
  } catch (error) {
    console.error('❌ API 응답 처리 중 예상치 못한 오류:', error);
    
    return {
      success: false,
      error: `Unexpected error in response handling: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseType: 'json'
    };
  }
}

/**
 * 재시도와 함께 API 호출하기
 */
export async function fetchWithRetryAndParsing(
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<ApiResponse> {
  let lastError: string = 'Unknown error';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 API 호출 (시도 ${attempt}/${maxRetries}): ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, application/xml, text/xml',
          'User-Agent': 'Mozilla/5.0 (compatible; ApartmentInfoBot/1.0)',
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await handleApiResponse(response);
      
      if (result.success) {
        console.log(`✅ API 호출 성공 (${result.responseType} 형식)`);
        return result;
      } else {
        throw new Error(result.error || 'Response parsing failed');
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ API 호출 실패 (시도 ${attempt}/${maxRetries}):`, lastError);
      
      if (attempt < maxRetries) {
        const delay = Math.min(delayMs * attempt, 5000);
        console.log(`⏱️ ${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
    responseType: 'json'
  };
}

/**
 * 정부 API 응답에서 실제 데이터 추출
 */
export function extractGovernmentApiData(apiResponse: ApiResponse): {
  success: boolean;
  data?: any;
  items?: any[];
  item?: any;
  error?: string;
} {
  if (!apiResponse.success || !apiResponse.data) {
    return {
      success: false,
      error: apiResponse.error || 'No data in API response'
    };
  }
  
  const data = apiResponse.data;
  
  // 정부 API 표준 응답 구조 확인
  if (data.response) {
    const header = data.response.header;
    const body = data.response.body;
    
    // 응답 코드 확인 (00 또는 000 모두 성공으로 처리)
    const resultCode = String(header?.resultCode || '').trim();
    if (resultCode !== '00' && resultCode !== '000') {
      return {
        success: false,
        error: `API Error ${resultCode}: ${header?.resultMsg || 'Unknown error'}`
      };
    }
    
    // 데이터 추출
    const result: any = {
      success: true,
      data: body
    };
    
    if (body?.items) {
      result.items = Array.isArray(body.items) ? body.items : [body.items];
    }
    
    if (body?.item) {
      result.item = body.item;
    }
    
    return result;
  }
  
  // 표준 구조가 아닌 경우
  return {
    success: true,
    data: data
  };
}