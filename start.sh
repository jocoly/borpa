cd video-backend && docker build --no-cache . -t video-backend-image
cd ..
cd image-backend && docker build --no-cache . -t image-backend-image
cd ..
cd bot && docker build --no-cache . -t bot-image
docker run --runtime=nvidia --mount source=videos,target=/app video-backend-image
docker run --runtime=nvidia --mount source=images,target=/app image-backend-image
docker run --mount source=videos,target=/app --mount source=images,target=/app bot-image