1. 정한솔 
(1) 전체 페이지 UI 제작
./templates/index.html - 서버 접속 시, 먼저 나타나는 홈 페이지 문서
./templates/visualize.html - 클라우드 인프라 가시화 페이지 문서
./templates/iam.html - 클라우드 IAM 가시화 페이지 문서
./static/css/style.css - 모든 html 페이지에 적용되는 스타일을 지정하는 css 코드
./static/css/packed_circle.css -  ./templates/visualize.html 페이지 문서의 스타일을 지정하는 css 코드
./static/css/tree_boxes.css - ./templates/iam.html 페이지 문서의 스타일을 지정하는 css 코드
./static/js/btn.js - 클라우드 인프라 가시화 페이지에서 오른쪽 사이드바를 표시하는 버튼의 클릭 이벤트를 감지하는 javascript 코드

(2) IAM 데이터 가시화
./static/js/tree_boxes.js - ./templates/iam.html 페이지 문서에 나타낼 조직도를 생성하는 javascript 코드


2. 신정규
(1) 클라우드 가시화 구현
./static/js/packed_circle.js - ./templates/visualize.html 페이지 문서에 나타낼 packing circle 가시화 결과물을 생성하는 javascript 코드

(2) 클라우드 인프라 데이터 수집 및 가공 일부
./get_data.py의 get_infra 함수 - 구축된 인프라의 데이터를 요청하고 응답 데이터를 가공하여 ./static/js/packed_circle.js의 입력 JSON 데이터를 반환하는 python 함수

(3) Flask 서버
./app.py - 요청된 URI에 따라 적절한 html 페이지를 응답으로 전송하는 Flask 서버 python 코드


3. 김구연
(1) 클라우드 인프라 데이터 수집 및 가공 일부
./get_data.py의 get_infra 함수 - 구축된 인프라의 데이터를 요청하고 응답 데이터를 가공하여 ./static/js/packed_circle.js의 입력 JSON 데이터를 반환하는 python 함수

(2) IAM 데이터 수집 및 가공
./get_data.py의 get_iam 함수 - 구축된 인프라에 적용된 IAM 데이터를 요청하고 응답 데이터를 가공하여 ./static/js/tree_boxes.js의 입력 JSON 데이터를 반환하는 python 함수

4. 박재헌
(1) AWS 클라우드 인프라 구축
(2) IAM 사용자 계정 및 그룹 다수 생성