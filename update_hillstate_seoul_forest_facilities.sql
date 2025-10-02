-- 힐스테이트서울숲리버 관공서 및 공원 정보 수정
UPDATE apartment_facilities 
SET nearby_government_offices = '금호4가동 주민센터',
    nearby_parks = '응봉산해맞이 명소, 응봉산 인공 암벽 공원',
    updated_at = now()
WHERE complex_id IN (
    SELECT id 
    FROM apartment_complexes 
    WHERE name LIKE '%힐스테이트서울숲리버%'
);

-- 업데이트 확인용 쿼리
SELECT ac.name, af.nearby_government_offices, af.nearby_parks
FROM apartment_complexes ac
LEFT JOIN apartment_facilities af ON ac.id = af.complex_id
WHERE ac.name LIKE '%힐스테이트서울숲리버%';