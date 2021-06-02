import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import PortalVue from 'portal-vue'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "../css/calc1.scss";
import "@babel/polyfill"
import {diff} from "./color";

let version = "0.1";

Vue.use(BootstrapVue);
Vue.use(PortalVue);

let app = new Vue({
    el:"#app",
    data:function () {
        let data = {
            version:version
        };
        return data;
    },
    computed: {
    },
    methods:{
        calc(){
            if (this.point.x1+this.point.x2+this.point.x3===0){
                this.exp.curr = -1;
                this.exp.next = -1;
                this.exp.full = -1;
                this.exp.process = "-";
            }else if (this.point.x1===0 && this.point.x2===1 && this.point.x3===1){
                this.exp.curr = this.expData[9];
                this.exp.next = 0;
                this.exp.full = 0;
                this.exp.process = "100%";
            }else {
                let full = this.point.x3 - this.point.x1;
                let has = this.point.x2 - this.point.x1 + 1;
                let process = has / full;
                this.exp.process = Math.round(process * 10000) / 100 + "%";
                let curr = Math.round(this.expData[this.level-1] * process);
                this.exp.curr = curr;
                this.exp.next = this.expData[this.level-1] - curr;
                this.exp.full = this.exp.next;
                for (let i=this.level;i<9;i++){
                    this.exp.full += this.expData[i];
                }

            }
        },
        loadImg(file){
            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            let img = new Image;
            img.onload = ()=>{
                this.$refs.canvas.getContext("2d").drawImage(img,0,0);
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img,0,0);
                let data = ctx.getImageData(0,0,img.width,img.height);
                let points = [];
                let minX = -1;
                let maxX = -1;
                let ys = [];
                let target = {
                    r:171,
                    g:167,
                    b:243
                }
                let allDiff = 0;
                let test = {};
                for (let x=0,w=data.width;x<w;x++){
                    points[x] = [];
                    for (let y=0,h=data.height;y<h;y++){
                        let start = (y*w+x)*4;
                        let point = {
                            r:data.data[start],
                            g:data.data[start+1],
                            b:data.data[start+2],
                            a:data.data[start+3],
                        };
                        point.diff255 = diff({r:255,g:255,b:255},point);
                        point.diffTarget = diff(target,point)
                        allDiff+= point.diff255;
                        points[x][y] = point;
                        if (point.diffTarget<5){
                            test[y] = test[y] || {};
                            test[y][x] = point;
                        }
                    }
                }
                console.log(test)
                let pDiff = allDiff / data.width / data.height;
                let pR = {
                    diff:999
                }
                for (let x=0;x<data.width;x++){
                    for (let y=0;y<data.height;y++){
                        let point = points[x][y];
                        let a = Math.abs(point.diff255 - pDiff);
                        if (a < pR.diff){
                            pR.diff = a;
                            pR.point = point;
                        }
                    }
                }
                console.log(pR);
                console.log(pDiff);
                console.log(points);

                for (let y=0;y<data.height;y++){
                    let max = 0;
                    let maxX = -1;
                    let max1 = 0;
                    for (let x=0;x<data.width;x++){
                        let point = points[x][y];
                        max = Math.max(point.diffTarget,max);
                        if (max===point.diffTarget) maxX = x;
                    }
                    console.log(maxX,y,max)
                }
            };
            img.src = URL.createObjectURL(file);
        }
    },
    mounted() {
        this.$refs.canvas.ondragleave = (e) => {
            e.preventDefault();  //阻止离开时的浏览器默认行为
        };
        this.$refs.canvas.ondrop = (e) => {
            e.preventDefault();    //阻止拖放后的浏览器默认行为
            const data = e.dataTransfer.files;  // 获取文件对象
            if (data.length < 1) {
                return;  // 检测是否有文件拖拽到页面
            }
            let file = data[0];
            let fileName = file.name.toLocaleLowerCase();
            if (fileName.indexOf("png")===-1 && fileName.indexOf("bmp")===-1){
                this.$bvToast.toast('只能识别png图片和bmp图片', {
                    title: '错误',
                    variant: 'danger',//danger,warning,info,primary,secondary,default
                    solid: true
                });
                return;
            }
            this.loadImg(file);
        };
        this.$refs.canvas.ondragenter = (e) => {
            e.preventDefault();  //阻止拖入时的浏览器默认行为
            // this.$refs.canvas.border = '2px dashed red';
        };
        this.$refs.canvas.ondragover = (e) => {
            e.preventDefault();    //阻止拖来拖去的浏览器默认行为
        };
    }
});