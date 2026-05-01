import os
import glob
from PIL import Image

def resize_frames():
    input_dir = 'public/video-frames'
    
    # Get all png files
    files = glob.glob(os.path.join(input_dir, '*.png'))
    total = len(files)
    
    for i, file in enumerate(files):
        with Image.open(file) as img:
            # Resize back to 1280x720
            resized = img.resize((1280, 720), Image.Resampling.LANCZOS)
            # Overwrite the original file
            resized.save(file)
            
        if (i+1) % 10 == 0:
            print(f"Processed {i+1}/{total} frames")

if __name__ == '__main__':
    resize_frames()
    print("Done!")
