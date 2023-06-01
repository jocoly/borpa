cd video-backend && pip install -r requirements.txt
python3 modelscope_app.py
cd ..
cd image-backend && pip install -r requirements.txt
python3 sd_app.py
cd ..
cd bot && node bot.js