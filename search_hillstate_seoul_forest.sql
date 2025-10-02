SELECT ac.name, af.nearby_government_offices, af.nearby_parks, ac.address, ac.road_address
FROM apartment_complexes ac
LEFT JOIN apartment_facilities af ON ac.id = af.complex_id
WHERE ac.name LIKE '%힐스테이트서울숲리버%' OR ac.name LIKE '%서울숲%' OR ac.name LIKE '%힐스테이트%';