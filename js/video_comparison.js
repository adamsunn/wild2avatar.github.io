// Written by Dor Verbin, October 2021
// This is based on: http://thenewcode.com/364/Interactive-Before-and-After-Video-Comparison-in-HTML5-Canvas
// With additional modifications based on: https://jsfiddle.net/7sk5k4gp/13/
// Modified by Keunhong Park to be responsive to window size.


Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};


class VideoComparison {
  constructor(container) {
      this.container = container;
      this.position = 0.5;
      this.canvas = container.find('canvas');
      this.video = container.find('video');
      this.context = this.canvas[0].getContext("2d");

      this.isPlaying = false;

      this.video[0].style.height = "0px";  // Hide video without stopping it
      this.video[0].playbackRate = 0.5;

      let self = this;
      container.on('tab:show', function (e) {
          self.playWhenReady();
      });
      container.on('tab:hide', function(e) {
          // self.video[0].pause();
          self.pause();
      });

      function trackLocation(e) {
          // Normalize to [0, 1]
          self.bcr = self.canvas[0].getBoundingClientRect();
          self.position = ((e.pageX - self.bcr.x) / self.bcr.width);
      }
      function trackLocationTouch(e) {
          // Normalize to [0, 1]
          self.bcr = self.canvas[0].getBoundingClientRect();
          self.position = ((e.touches[0].pageX - self.bcr.x) / self.bcr.width);
      }

      this.canvas.on('mousemove', trackLocation);
      this.canvas.on('touchstart', trackLocationTouch);
      this.canvas.on('touchmove', trackLocationTouch);
      this.canvas.on('mouseout', function () { self.position = 0.5; });

      $(window).on('resize', function (e) {
          self.resize();
      });
  }

  resize() {
      const videoWidth = this.video[0].videoWidth / 2;
      const videoHeight = this.video[0].videoHeight;
      const canvasWidth = this.container.width();
      const canvasHeight = canvasWidth * videoHeight / videoWidth;
      this.canvas[0].width = canvasWidth;
      this.canvas[0].height = canvasHeight;
  }

  play() {
      this.resize();
      if (this.isPlaying) {
          return;
      }
      console.log('Playing video', this.video[0])
      this.isPlaying = true;
      this.video[0].play();
      this.drawLoop();
  }

  pause() {
      this.video[0].pause();
      this.isPlaying = false;
  }

  playWhenReady() {
      console.log('play when ready', this.video[0])
      const self = this;
      if (self.video[0].readyState >= 3) {
          self.play();
      } else if (!self.readyStateListenerAttached) {
          document.addEventListener('readystatechange', function () {
              if (self.video[0].readyState >= 3) {
                  self.play();
              }
          });
      }
  }

  drawLoop() {
      const self = this;
      const video = this.video[0];
      const container = this.container;
      const context = this.context;
      requestAnimationFrame(drawFrame);

      function drawFrame() {
          const videoWidth = video.videoWidth / 2;
          const videoHeight = video.videoHeight;
          const canvasWidth = container.width();
          const canvasHeight = canvasWidth * videoHeight / videoWidth;
          const position = self.position;

          context.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvasWidth, canvasHeight);
          var colStart = (canvasWidth * position).clamp(0.0, canvasWidth);
          var colWidth = (canvasWidth - (canvasWidth * position)).clamp(0.0, canvasWidth);
          var sourceColStart = (videoWidth * position).clamp(0.0, videoWidth);
          var sourceColWidth = (videoWidth - (videoWidth * position)).clamp(0.0, videoWidth);
          context.drawImage(
              video,
              sourceColStart + videoWidth, 0,
              sourceColWidth, videoHeight,
              colStart, 0,
              colWidth, canvasHeight);

          var arrowLength = 0.09 * canvasHeight;
          var arrowheadWidth = 0.025 * canvasHeight;
          var arrowheadLength = 0.04 * canvasHeight;
          var arrowPosY = canvasHeight / 10;
          var arrowWidth = 0.007 * canvasHeight;
          var currX = canvasWidth * position;

          // Draw circle
          context.arc(currX, arrowPosY, arrowLength * 0.7, 0, Math.PI * 2, false);
          context.fillStyle = "#FFD79340";
          context.fill()

          // Draw border
          context.beginPath();
          context.moveTo(canvasWidth * position, 0);
          context.lineTo(canvasWidth * position, canvasHeight);
          context.closePath()
          context.strokeStyle = "#AAAAAA";
          context.lineWidth = 5;
          context.stroke();

          // Draw arrow
          context.beginPath();
          context.moveTo(currX, arrowPosY - arrowWidth / 2);

          // Move right until meeting arrow head
          context.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY - arrowWidth / 2);

          // Draw right arrow head
          context.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY - arrowheadWidth / 2);
          context.lineTo(currX + arrowLength / 2, arrowPosY);
          context.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY + arrowheadWidth / 2);
          context.lineTo(currX + arrowLength / 2 - arrowheadLength / 2, arrowPosY + arrowWidth / 2);

          // Go back to the left until meeting left arrow head
          context.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY + arrowWidth / 2);

          // Draw left arrow head
          context.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY + arrowheadWidth / 2);
          context.lineTo(currX - arrowLength / 2, arrowPosY);
          context.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY - arrowheadWidth / 2);
          context.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY);

          context.lineTo(currX - arrowLength / 2 + arrowheadLength / 2, arrowPosY - arrowWidth / 2);
          context.lineTo(currX, arrowPosY - arrowWidth / 2);

          context.closePath();

          context.fillStyle = "#AAAAAA";
          context.fill();

          context.font = "20px 'Google Sans', sans-serif";
          context.fillStyle = "white";
          context.strokeStyle = 'black';
          context.lineWidth = 2;
          context.textAlign = "left";
          context.textBaseline = "bottom";

          if (self.isPlaying) {
              requestAnimationFrame(drawFrame);
          }
      }
  }
}

function playVids(videoId) {
    var videoMerge = document.getElementById(videoId + "Merge");
    var vid = document.getElementById(videoId);

    var position = 0.5;
    var vidWidth = vid.videoWidth/2;
    var vidHeight = vid.videoHeight;

    var mergeContext = videoMerge.getContext("2d");

    
    if (vid.readyState > 3) {
        vid.play();

        function trackLocation(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.pageX - bcr.x) / bcr.width);
        }
        function trackLocationTouch(e) {
            // Normalize to [0, 1]
            bcr = videoMerge.getBoundingClientRect();
            position = ((e.touches[0].pageX - bcr.x) / bcr.width);
        }

        videoMerge.addEventListener("mousemove",  trackLocation, false); 
        videoMerge.addEventListener("touchstart", trackLocationTouch, false);
        videoMerge.addEventListener("touchmove",  trackLocationTouch, false);


        function drawLoop() {
            mergeContext.drawImage(vid, 0, 0, vidWidth, vidHeight, 0, 0, vidWidth, vidHeight);
            var colStart = (vidWidth * position).clamp(0.0, vidWidth);
            var colWidth = (vidWidth - (vidWidth * position)).clamp(0.0, vidWidth);
            mergeContext.drawImage(vid, colStart+vidWidth, 0, colWidth, vidHeight, colStart, 0, colWidth, vidHeight);
            requestAnimationFrame(drawLoop);

            
            var arrowLength = 0.09 * vidHeight;
            var arrowheadWidth = 0.025 * vidHeight;
            var arrowheadLength = 0.04 * vidHeight;
            var arrowPosY = vidHeight / 10;
            var arrowWidth = 0.007 * vidHeight;
            var currX = vidWidth * position;

            // Draw circle
            mergeContext.arc(currX, arrowPosY, arrowLength*0.7, 0, Math.PI * 2, false);
            mergeContext.fillStyle = "#FFD79340";
            mergeContext.fill()
            //mergeContext.strokeStyle = "#444444";
            //mergeContext.stroke()
            
            // Draw border
            mergeContext.beginPath();
            mergeContext.moveTo(vidWidth*position, 0);
            mergeContext.lineTo(vidWidth*position, vidHeight);
            mergeContext.closePath()
            mergeContext.strokeStyle = "#444444";
            mergeContext.lineWidth = 5;            
            mergeContext.stroke();

            // Draw arrow
            mergeContext.beginPath();
            mergeContext.moveTo(currX, arrowPosY - arrowWidth/2);
            
            // Move right until meeting arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowWidth/2);
            
            // Draw right arrow head
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY - arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2, arrowPosY);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowheadWidth/2);
            mergeContext.lineTo(currX + arrowLength/2 - arrowheadLength/2, arrowPosY + arrowWidth/2);

            // Go back to the left until meeting left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowWidth/2);
            
            // Draw left arrow head
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY + arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2, arrowPosY);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY  - arrowheadWidth/2);
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY);
            
            mergeContext.lineTo(currX - arrowLength/2 + arrowheadLength/2, arrowPosY - arrowWidth/2);
            mergeContext.lineTo(currX, arrowPosY - arrowWidth/2);

            mergeContext.closePath();

            mergeContext.fillStyle = "#444444";
            mergeContext.fill();

            
            
        }
        requestAnimationFrame(drawLoop);
    } 
}


function resizeAndPlay(element)
{
  var cv = document.getElementById(element.id + "Merge");
  cv.width = element.videoWidth/2;
  cv.height = element.videoHeight;
  element.play();
  element.style.height = "0px";  // Hide video without stopping it
    
  playVids(element.id);
}