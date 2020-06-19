import _ from 'lodash'

const bridgeVideoElementId = '##video-clipper-bridge-video-element-id##'
const bridgeOutputCanvasElementId = '##video-clipper-bridge-canvas-canvas-element-id##'
const hideBridgeElementsStyle = 'position: absolute; top: -10000000000px; left: 0; width: 320px; z-index: -10000;'

export default class VideoClipper {
  constructor() {
    let bridgeVideo = document.getElementById(bridgeVideoElementId)
    if (_.isNil(bridgeVideo) === true) {
      bridgeVideo = document.createElement('video')
      bridgeVideo.id = bridgeVideoElementId
      bridgeVideo.autoplay = true
      bridgeVideo.muted = true
      bridgeVideo.style = hideBridgeElementsStyle // 一个隐藏的 video 标签, 用来播视频流
      document.body.appendChild(bridgeVideo)
    }
    this.bridgeVideo = bridgeVideo

    let outputCanvas = document.getElementById(bridgeOutputCanvasElementId)
    if (_.isNil(outputCanvas) === true) {
      outputCanvas = document.createElement('canvas')
      outputCanvas.id = bridgeOutputCanvasElementId
      outputCanvas.style = hideBridgeElementsStyle // 一个隐藏的 canvas 标签, 用来裁剪 bridgeVideo
      document.body.appendChild(outputCanvas)
    }
    this.outputCanvas = outputCanvas
    this.outputCanvasCtx = this.outputCanvas.getContext('2d')
    this.outputCanvasCtx.webkitImageSmoothingEnabled = false
    this.outputCanvasCtx.imageSmoothingEnabled = false
  }

  isWorking = false

  bridgeVideo

  outputCanvas

  outputStream

  clipOption = {
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
  }


  clip() {
    if (this.isWorking === false) return
    const {
      width,
      height,
      offsetX,
      offsetY,
    } = this.clipOption

    this.outputCanvasCtx.drawImage(
      this.bridgeVideo,
      offsetX,
      offsetY,
      width,
      height,
      0,
      0,
      this.outputCanvas.width,
      this.outputCanvas.height,
    )
    requestAnimationFrame(this.clip.bind(this))
  }

  start(stream, clipRatio) {
    return new Promise((resolve, reject) => {
      this.isWorking = true
      const {
        bridgeVideo,
      } = this

      bridgeVideo.onloadedmetadata = () => {
        const {
          videoWidth,
          videoHeight,
        } = bridgeVideo
        const originRatio = videoWidth / videoHeight
        if (videoWidth === 0 || videoWidth === 0 || Math.abs(originRatio - clipRatio) < 0.000001) {
          // 原视频比例和目标比例相同不做处理
          console.log('VideoClipper escape', clipRatio, videoWidth, videoHeight)
          this.outputStream = stream
          resolve(stream)
        } else {
          this.bridgeVideo.play().then(() => {
            if (originRatio > clipRatio) {
              this.clipOption.height = videoHeight
              this.clipOption.width = videoHeight * clipRatio
              this.clipOption.offsetX = (videoWidth - this.clipOption.width) / 2
              this.clipOption.offsetY = 0
            } else {
              this.clipOption.width = videoWidth
              this.clipOption.height = videoWidth / clipRatio
              this.clipOption.offsetY = (videoHeight - this.clipOption.height) / 2
              this.clipOption.offsetX = 0
            }
            this.outputCanvas.width = this.clipOption.width
            this.outputCanvas.height = this.clipOption.height
            console.log('VideoClipper clip', videoWidth, videoHeight, this.clipOption)
            this.clip()
            this.outputStream = this.outputCanvas.captureStream(15)
            resolve(this.outputStream)
          }).catch(reject)
        }
      }

      bridgeVideo.srcObject = stream
    })
  }

  stop() {
    console.log('VideoClipper stopped')
    this.isWorking = false
  }
}
