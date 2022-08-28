/*
 * @Author: caopx
 * @Date: 2021-06-25 16:01:50
 * @LastEditTime: 2022-01-27 20:56:03
 */
import React from "react";
import './CavansOuter.css'
import img from './example_img2.png'

class CanvasOuter extends React.Component {
  alphaCanvas!: HTMLCanvasElement;
  alphaCanvasContext!: CanvasRenderingContext2D;
  imgData: any;
  currentImgData: any;
  imageSrc = img;
  editImgData: any;
  originalImagePixelData: any;
  clientX: number;
  clientY: number;
  currentPixelRGBA: any;
  scaleCanvas = 2;
  mouseState: 'down' | 'up' = 'up';
  threshold: number;
  realRgbaPicker: number[] = [];
  fillColor: number[] = [];
  fillPoints: any[] = [];
  originalImagePixelBackData: any;
  cachePointsLength: any = [];
  thresholdCircle!: HTMLElement;
  outerCanvas!: HTMLElement;

  constructor(props: {} | Readonly<{}>) {
    super(props);
    this.state = {};
    this.clientX = 0;
    this.clientY = 0;
    this.threshold = 0;

    document.addEventListener('mouseup', this.onOutCanvasUp);
  }

  componentDidMount () {
    this.initImg();
    this.thresholdCircle = document.getElementById('thresholdCircle') as HTMLElement;
  }

  initCanvas() {
    this.alphaCanvas = document.getElementById('alphaCanvas') as HTMLCanvasElement;
    this.alphaCanvasContext = this.alphaCanvas.getContext('2d') as CanvasRenderingContext2D;

    this.alphaCanvas.width = 800 * this.scaleCanvas;
    this.alphaCanvas.height = 800 * this.scaleCanvas;

    this.alphaCanvasContext.scale(this.scaleCanvas, this.scaleCanvas);
  }

  addEventListener() {
    this.alphaCanvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.alphaCanvas.addEventListener('mousemove', this.onCnavasMouseMove.bind(this));
    this.alphaCanvas.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  removeEventListener() {
    if (this.alphaCanvas) {
      this.alphaCanvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
      this.alphaCanvas.removeEventListener('mousemove', this.onCnavasMouseMove.bind(this));
      this.alphaCanvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }
  }

  transXYToImageData(image: Uint8ClampedArray, x: number, y: number) {
    const width = this.alphaCanvas.width;

    const i = x * width + y;
    const r = image[4 * i];
    const g = image[4 * i + 1];
    const b = image[4 * i + 2];
    const a = image[4 * i + 3];

    return [r, g, b, a];
  }

  transPoint (p: number) {
    return Math.ceil(p) * this.scaleCanvas
  }

  getOriPosition (p: number) {
    return Math.floor(p / this.scaleCanvas);
  }

  onOutCanvasUp = () => {
    if (this.mouseState === 'down') {
      this.onMouseUp();
    }
  };
  
  onMouseDown(event: MouseEvent) {
    console.log(event);
    this.mouseState = 'down';

    this.clientX = this.transPoint(event.offsetX);
    this.clientY = this.transPoint(event.offsetY);

    this.currentPixelRGBA = this.transXYToImageData(this.originalImagePixelData, this.clientY, this.clientX);
    this.updateFillColor();
  }

  onCnavasMouseMove(e: any) {
    if (this.mouseState !== 'down') return;

    const threshold = this.calculateTheDistanceOfTheTwoPoints(this.getOriPosition(this.clientX), this.getOriPosition(this.clientY), e.offsetX, e.offsetY);
    this.dragCircle(this.getOriPosition(this.clientX), this.getOriPosition(this.clientY), threshold);
    
    if (Math.abs(this.threshold - threshold) < 3) {
      return false;
    }
    
    this.threshold = Math.floor(threshold);
    console.log(this.threshold);
    setTimeout(() => {
      this.drawImage();
    }, 0);
  }

  private getRGBA(pixelRGBA: number[]) {
    return {
      r: pixelRGBA[0],
      g: pixelRGBA[1],
      b: pixelRGBA[2],
      a: pixelRGBA[3]
    };
  }

  updateFillColor() {
    const { r, g, b, a } = this.getRGBA(this.currentPixelRGBA);
    this.realRgbaPicker = [r, g, b, a];
    this.fillColor = [255 - r, 255 - g, 255 - b, 255];
  }

  calculateTheDistanceOfTheTwoPoints(x: number, y: number, ix: number, iy: number) {
    const xLength = Math.abs(x - ix);
    const yLength = Math.abs(y - iy);
    return Math.sqrt(xLength * xLength + yLength * yLength);
  }

  dragCircle(x: number, y: number, threshold: number) {
    console.log(threshold);
    this.thresholdCircle!.innerHTML = '';;
    const frag = document.createDocumentFragment();
    frag.appendChild(this.point(x, y, threshold));
    this.thresholdCircle!.appendChild(frag);
  }

  point(x: number, y: number, r: number) {
    const circle = document.createElement('div');
    circle.style.position = 'absolute';
    circle.style.width = r * 2 + 'px';
    circle.style.height = r * 2 + 'px';
    circle.style.backgroundColor = 'transparent';
    circle.style.borderRadius = '50%';
    circle.style.border = '3px solid gold';
    circle.style.left = x - r + 'px';
    circle.style.top = y - r + 'px';
    circle.style.zIndex = '10000';
    return circle;
  }

  drawImage() {
    const fillPoints = this.floodFill(this.originalImagePixelBackData, this.clientY, this.clientX, this.realRgbaPicker, this.fillColor, this.threshold);
    if (fillPoints.length !== 0 && fillPoints.length === this.fillPoints.length) {
      return;
    } else {
      this.fillPoints = fillPoints;
      this.updateImage(this.fillColor);
    }
  }

  updateImage(fillColor: number[], update = false) {
    if (!update && (this.cachePointsLength === this.fillPoints.length || this.fillPoints.length < 10)) {
      return false;
    }

    this.editImgData.data.set(this.currentImgData.data);
    this.fillPoints.forEach((point: number[]) => {
      const x = point[0] * 4 * this.imgData.width + 4 * point[1];
      this.editImgData.data[x] = fillColor[0];
      this.editImgData.data[x + 1] = fillColor[1];
      this.editImgData.data[x + 2] = fillColor[2];
      this.editImgData.data[x + 3] = fillColor[3];
    });

    if (update) {
      this.originalImagePixelBackData = new Uint8ClampedArray(this.editImgData.data);
    }

    this.cachePointsLength = this.fillPoints.length;
    // put数据
    this.alphaCanvasContext.putImageData(
      this.editImgData,
      0,
      0,
      0,
      0,
      this.alphaCanvas.width * this.scaleCanvas,
      this.alphaCanvas.height * this.scaleCanvas,
    );
  }

   /**
   * 计算出用反色填充的颜色数组
   *
   * @param originalImage 原始图片像素数组 Uint8ClampedArray
   * @param sr 点击的 x
   * @param sc 点击的 y
   * @param origColor 点击位置的颜色
   * @param newColor 需要提交成的反色
   * @param threshold 阈值
   */
    floodFill(originalImage: Uint8ClampedArray, sr: number, sc: number, origColor: number[], newColor: number[], threshold: number) {
      let x: number;
      let y: number;
  
      let image = new Array(this.alphaCanvas.height).fill(0);
      image = image.map(val => new Array(this.alphaCanvas.width).fill(0));
      const alphaPixels: number[] = [];
  
      image[sr][sc] = -1;
      const fillPoints: number[][] = [];
      fillPoints.push([sr, sc]);
      alphaPixels.push(sr);
      alphaPixels.push(sc);
  
      while (alphaPixels.length) {
        y = alphaPixels.pop() as number;
        x = alphaPixels.pop() as number;
  
        const x1 = this.transXYToImageData(originalImage, x - 1, y);
        const x2 = this.transXYToImageData(originalImage, x + 1, y);
        const x3 = this.transXYToImageData(originalImage, x, y - 1);
        const x4 = this.transXYToImageData(originalImage, x, y + 1);
  
        // 1
        if (x > 0 && image[x - 1][y] !== -1 && x1.join(',') !== '0,0,0,0' && this.judgeChange(origColor, x1)) {
          image[x - 1][y] = -1;
          alphaPixels.push(x - 1);
          alphaPixels.push(y);
          fillPoints.push([x - 1, y]);
        }
  
        // 2
        if (
          x < this.alphaCanvas.height - 1 &&
          image[x + 1][y] !== -1 &&
          x2.join(',') !== '0,0,0,0' &&
          this.judgeChange(origColor, x2)
        ) {
          image[x + 1][y] = -1;
          alphaPixels.push(x + 1);
          alphaPixels.push(y);
          fillPoints.push([x + 1, y]);
        }
  
        // 3
        if (y > 0 && image[x][y - 1] !== -1 && x3.join(',') !== '0,0,0,0' && this.judgeChange(origColor, x3)) {
          image[x][y - 1] = -1;
          alphaPixels.push(x);
          alphaPixels.push(y - 1);
          fillPoints.push([x, y - 1]);
        }
  
        // 4
        if (
          y < this.alphaCanvas.width - 1 &&
          image[x][y + 1] !== -1 &&
          x4.join(',') !== '0,0,0,0' &&
          this.judgeChange(origColor, x4)
        ) {
          image[x][y + 1] = -1;
          alphaPixels.push(x);
          alphaPixels.push(y + 1);
          fillPoints.push([x, y + 1]);
        }
      }
  
      image = [];
      return fillPoints;
    }


  private judgeChange(origColor: number[], currentPoint: number[]): boolean {
    let xsd = 0;

    const r = origColor[0];
    const g = origColor[1];
    const b = origColor[2];
    xsd = Math.sqrt(
      (r - currentPoint[0]) * (r - currentPoint[0]) +
        (g - currentPoint[1]) * (g - currentPoint[1]) +
        (b - currentPoint[2]) * (b - currentPoint[2]),
    );

    return xsd <= this.threshold;
  }

  initImg() {
    const img = new Image();
    img.crossOrigin = ''; // 跨域
    img.onload = () => {
      // 初始化 canvas
      this.initCanvas();

      // canvas 增加事件监听 TODO 事件绑定
      this.addEventListener();

      this.alphaCanvasContext.drawImage(img, 0, 0);
      // 获取像素信息数据
      this.imgData = this.getImageData();
      // 创建 imgData 处理鼠标按下到鼠标抬起间的数据恢复
      this.currentImgData = this.imgData;
      this.editImgData = new ImageData(this.currentImgData.width, this.currentImgData.height);

      this.originalImagePixelData = new Uint8ClampedArray(this.imgData.data);
      this.originalImagePixelBackData = new Uint8ClampedArray(this.imgData.data);
    };
    img.onerror = (e) => {
      console.error(e);
    };

    img.src = this.imageSrc;
  }

  getImageData () {
    return this.alphaCanvasContext.getImageData(
      0,
      0,
      800 * this.scaleCanvas,
      800 * this.scaleCanvas,
    );
  }

  onMouseUp() {
    this.removeEventListener();
    this.mouseState = 'up';

    if (this.threshold) {
      // 避免滑动生效
      this.updateImage([0, 0, 0, 0], true);
      // 鼠标抬起：此次操作结束，不可恢复
      this.currentImgData = this.getImageData();
      this.threshold = 0;
      this.thresholdCircle!.innerHTML = '';
    }
  }

  render() {
    return <div id="root">
      <div id="thresholdCircle"></div>
      <canvas id="alphaCanvas" className="canvas-outer">
      </canvas>
    </div>;
  }
}

export default CanvasOuter;