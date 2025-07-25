#!/bin/bash

# WorkAdventure 서버 설치 스크립트
# CM's Note Virtual Office

echo "🎮 WorkAdventure Server Setup Script"
echo "===================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 시스템 요구사항 체크
echo -e "${YELLOW}1. Checking system requirements...${NC}"

# Docker 체크
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

# Docker Compose 체크
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
else
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
fi

# 2. 디렉토리 생성
echo -e "\n${YELLOW}2. Creating directories...${NC}"
mkdir -p workadventure-server/{maps,config,data}
cd workadventure-server

# 3. 환경 변수 설정
echo -e "\n${YELLOW}3. Setting up environment variables...${NC}"

# 도메인 입력
echo -n "Enter your domain (e.g., example.com): "
read DOMAIN

# 비밀 키 생성
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_API_TOKEN=$(openssl rand -hex 32)
TURN_PASSWORD=$(openssl rand -hex 16)

# .env 파일 생성
cat > .env << EOF
# WorkAdventure Configuration
DOMAIN=$DOMAIN
SECRET_KEY=$SECRET_KEY
ADMIN_API_TOKEN=$ADMIN_API_TOKEN
TURN_PASSWORD=$TURN_PASSWORD

# Jitsi Configuration (optional)
JITSI_URL=meet.jit.si
JITSI_ISS=
JITSI_SECRET=

# Authentication (optional)
OPID_CLIENT_ID=
OPID_CLIENT_SECRET=
OPID_CLIENT_ISSUER=

# Development
DEBUG_MODE=false
EOF

echo -e "${GREEN}✅ Environment file created${NC}"

# 4. Docker Compose 파일 생성
echo -e "\n${YELLOW}4. Creating Docker Compose configuration...${NC}"

cat > docker-compose.yml << 'EOF'
version: '3.7'

services:
  reverse-proxy:
    image: traefik:v2.9
    command:
      - --api.insecure=true
      - --providers.docker
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.myresolver.acme.tlschallenge=true
      - --certificatesresolvers.myresolver.acme.email=admin@${DOMAIN}
      - --certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data/letsencrypt:/letsencrypt
    networks:
      - workadventure

  front:
    image: thecodingmachine/workadventure-front:latest
    environment:
      - PUSHER_URL=//pusher.${DOMAIN}
      - UPLOADER_URL=//uploader.${DOMAIN}
      - ADMIN_URL=//admin.${DOMAIN}
      - MAPS_URL=//maps.${DOMAIN}
      - STARTUP_COMMAND_1=
      - STARTUP_COMMAND_2=
      - TURN_SERVER=turn:coturn.${DOMAIN}:3478
      - TURN_USER=workadventure
      - TURN_PASSWORD=${TURN_PASSWORD}
      - JITSI_URL=${JITSI_URL}
      - JITSI_PRIVATE_MODE=false
      - START_ROOM_URL=/_/global/maps.${DOMAIN}/main/map.json
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.front.rule=Host(`play.${DOMAIN}`)"
      - "traefik.http.routers.front.entrypoints=websecure"
      - "traefik.http.routers.front.tls.certresolver=myresolver"
      - "traefik.http.services.front.loadbalancer.server.port=80"
    networks:
      - workadventure

  pusher:
    image: thecodingmachine/workadventure-pusher:latest
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - API_URL=back:50051
      - FRONT_URL=https://play.${DOMAIN}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.pusher.rule=Host(`pusher.${DOMAIN}`)"
      - "traefik.http.routers.pusher.entrypoints=websecure"
      - "traefik.http.routers.pusher.tls.certresolver=myresolver"
      - "traefik.http.services.pusher.loadbalancer.server.port=8080"
    networks:
      - workadventure

  back:
    image: thecodingmachine/workadventure-back:latest
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - ADMIN_API_TOKEN=${ADMIN_API_TOKEN}
      - JITSI_URL=${JITSI_URL}
      - JITSI_ISS=${JITSI_ISS}
      - JITSI_SECRET=${JITSI_SECRET}
      - TURN_SERVER=turn:coturn.${DOMAIN}:3478
      - TURN_USER=workadventure
      - TURN_PASSWORD=${TURN_PASSWORD}
    networks:
      - workadventure

  uploader:
    image: thecodingmachine/workadventure-uploader:latest
    environment:
      - UPLOADER_URL=//uploader.${DOMAIN}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.uploader.rule=Host(`uploader.${DOMAIN}`)"
      - "traefik.http.routers.uploader.entrypoints=websecure"
      - "traefik.http.routers.uploader.tls.certresolver=myresolver"
      - "traefik.http.services.uploader.loadbalancer.server.port=8080"
    networks:
      - workadventure

  maps:
    image: nginx:alpine
    volumes:
      - ./maps:/usr/share/nginx/html
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.maps.rule=Host(`maps.${DOMAIN}`)"
      - "traefik.http.routers.maps.entrypoints=websecure"
      - "traefik.http.routers.maps.tls.certresolver=myresolver"
      - "traefik.http.services.maps.loadbalancer.server.port=80"
    networks:
      - workadventure

  coturn:
    image: coturn/coturn:4.5.2
    command:
      - turnserver
      - --log-file=stdout
      - --realm=${DOMAIN}
      - --lt-cred-mech
      - --fingerprint
      - --no-multicast-peers
      - --no-cli
      - --no-tlsv1
      - --no-tlsv1_1
      - --user=workadventure:${TURN_PASSWORD}
    ports:
      - "3478:3478/udp"
      - "3478:3478/tcp"
    networks:
      - workadventure

networks:
  workadventure:
    driver: bridge
EOF

echo -e "${GREEN}✅ Docker Compose file created${NC}"

# 5. 기본 맵 복사
echo -e "\n${YELLOW}5. Copying default map...${NC}"

# 현재 프로젝트의 맵을 복사
cp -r ../public/workadventure-map/* ./maps/
echo -e "${GREEN}✅ Map files copied${NC}"

# 6. nginx 설정 생성
echo -e "\n${YELLOW}6. Creating nginx configuration...${NC}"

cat > maps/nginx.conf << 'EOF'
server {
    listen 80;
    server_name maps.*;

    root /usr/share/nginx/html;
    index index.html;

    # CORS 헤더 추가
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';

    location / {
        try_files $uri $uri/ =404;
    }

    # JSON 파일 MIME 타입 설정
    location ~ \.json$ {
        add_header Content-Type application/json;
    }
}
EOF

# 7. 시작 스크립트 생성
echo -e "\n${YELLOW}7. Creating start script...${NC}"

cat > start.sh << 'EOF'
#!/bin/bash

echo "Starting WorkAdventure server..."

# .env 파일 로드
export $(cat .env | xargs)

# Docker Compose 시작
docker-compose up -d

echo ""
echo "WorkAdventure is starting up!"
echo "================================"
echo "Main URL: https://play.$DOMAIN"
echo "Maps URL: https://maps.$DOMAIN"
echo "Admin panel: http://localhost:8080"
echo ""
echo "Please wait a few minutes for all services to start."
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
EOF

chmod +x start.sh

# 8. 완료 메시지
echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure DNS records:"
echo "   - play.$DOMAIN → Your server IP"
echo "   - pusher.$DOMAIN → Your server IP"
echo "   - maps.$DOMAIN → Your server IP"
echo "   - uploader.$DOMAIN → Your server IP"
echo ""
echo "2. Open firewall ports:"
echo "   - 80 (HTTP)"
echo "   - 443 (HTTPS)"
echo "   - 3478 (TURN)"
echo ""
echo "3. Start the server:"
echo "   cd workadventure-server"
echo "   ./start.sh"
echo ""
echo "4. Access your WorkAdventure at:"
echo "   https://play.$DOMAIN"
echo ""
echo -e "${YELLOW}Note: SSL certificates will be automatically generated by Let's Encrypt${NC}"
