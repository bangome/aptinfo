'use client';

import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary/5 border-t">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-h5 font-bold text-foreground">아파트인포</span>
            </Link>
            <p className="text-body2 text-muted-foreground">
              전국 아파트 정보를 한눈에 보고
              <br />
              쉽게 비교할 수 있는 서비스
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-body2 text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                고객센터: 1588-0000
              </div>
              <div className="flex items-center text-body2 text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                help@aptinfo.kr
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-body1 text-foreground mb-4">서비스</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/search"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  아파트 검색
                </Link>
              </li>
              <li>
                <Link
                  href="/compare"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  단지 비교
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  관심 목록
                </Link>
              </li>
              <li>
                <Link
                  href="/glossary"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  용어 사전
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-body1 text-foreground mb-4">고객지원</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  도움말
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  문의하기
                </Link>
              </li>
              <li>
                <Link
                  href="/business"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  B2B 서비스
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-body1 text-foreground mb-4">법적고지</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer"
                  className="text-body2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  면책사항
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-body2 text-muted-foreground">
            © 2025 아파트인포. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center text-body2 text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              서울시 강남구 테헤란로 123
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}