import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import PortalVue from 'portal-vue'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "../css/calc1.scss";
import "@babel/polyfill"
import {diff,middleColor} from "./color";

let version = "0.6";

Vue.use(BootstrapVue);
Vue.use(PortalVue);

let app = new Vue({
    el:"#app",
    data:function () {
        let data = {
            version:version,
            exp:{
                curr:-1,
                next:-1,
                full:-1,
                process:"-"
            },
            point:{
                x1:0,
                x2:0,
                x3:0,
                y1:0,
                y2:0
            },
            expData:[
                1000,
                1550,
                2050,
                2600,
                3175,
                3750,
                4350,
                4975,
                5650
            ],
            level:1,
            tolerance:2,
            file:null
        };
        return data;
    },
    computed: {
    },
    methods:{
        selectFile(e){
            let file = e.target.files[0];
            if (!file) {
                this.$bvToast.toast('图片无效', {
                    title: '错误',
                    variant: 'danger',//danger,warning,info,primary,secondary,default
                    solid: true
                });
                return;
            }
            if (this.level>9 || this.level<1) {
                this.$bvToast.toast('好感等级无效，有效的好感等级是1-9', {
                    title: '错误',
                    variant: 'danger',//danger,warning,info,primary,secondary,default
                    solid: true
                });
                return;
            }
            this.file = file;
            this.loadImg();
            e.target.value = null;
        },
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
                let process = Math.max(0,Math.min(1,has / full));
                this.exp.process = Math.round(process * 10000) / 100 + "%";
                let curr = Math.round(this.expData[this.level-1] * process);
                this.exp.curr = curr;
                this.exp.next = this.expData[this.level-1] - curr;
                this.exp.full = this.exp.next;
                for (let i=this.level;i<9;i++){
                    this.exp.full += this.expData[i];
                }
                let c = this.$refs.canvas;
                let ct = c.getContext("2d");
                ct.strokeStyle = "red"
                ct.strokeRect(this.point.x1-1,this.point.y1-1,this.point.x2-this.point.x1+1,this.point.y2-this.point.y1+2);
                ct.strokeStyle = "#000000"
                ct.strokeRect(this.point.x2+1,this.point.y1-1,this.point.x3-this.point.x2+1,this.point.y2-this.point.y1+2);
            }
        },
        loadImg(){
            if (this.file===null) {
                this.$bvToast.toast('请先上传图片', {
                    title: '错误',
                    variant: 'danger',//danger,warning,info,primary,secondary,default
                    solid: true
                });
                return;
            }
            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            let img = new Image;
            img.onload = ()=>{
                let c = this.$refs.canvas;
                c.width = img.width;
                c.height = img.height;
                let ct = c.getContext("2d");
                ct.clearRect(0,0,c.width,c.height);
                ct.drawImage(img,0,0);
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
                        point.diff = diff(target,point)
                        // console.log(d,point)
                        if (point.diff<5){
                            if (minX===-1) minX=x;
                            if (maxX===-1) maxX=x;
                            minX = Math.min(minX,x);
                            maxX = Math.max(maxX,x);
                            if (ys.indexOf(y)===-1) ys.push(y);
                        }
                        points[x][y] = point;
                    }
                }
                if (maxX===-1 || minX===-1){
                    this.$bvToast.toast('没有识别到好感度进度条', {
                        title: '错误',
                        variant: 'danger',//danger,warning,info,primary,secondary,default
                        solid: true
                    });
                    return;
                }
                let rys = [];
                for (let i=0,l=ys.length;i<l;i++){
                    let y=ys[i];
                    let ok = 0;
                    for (let x=minX;x<=maxX;x++){
                        if (points[x][y].diff<=5){
                            ok++;
                        }
                    }
                    // console.log(ok/(maxX-minX+1))
                    if (ok/(maxX-minX+1) >= 0.95){
                        rys.push(y);
                    }
                }
                if (rys.length===0){
                    this.$bvToast.toast('没有识别到好感度进度条', {
                        title: '错误',
                        variant: 'danger',//danger,warning,info,primary,secondary,default
                        solid: true
                    });
                    return;
                }
                let middleIndex = Math.min(rys.length-1,Math.max(0,Math.round(rys.length/2)-1));
                let y = rys[middleIndex];
                this.point.y1 = rys[0];
                this.point.y2 = rys[rys.length-1];

                let bgs = [];
                if (minX>=5){
                    bgs.push(points[minX-5][y]);
                }
                if (y-middleIndex-5>=0){
                    bgs.push(points[minX][y-middleIndex-5]);
                    bgs.push(points[maxX][y-middleIndex-5]);
                }
                if (y+middleIndex+5<data.height){
                    bgs.push(points[minX][y+middleIndex+5]);
                    bgs.push(points[maxX][y+middleIndex+5]);
                }
                if (bgs.length===0){
                    this.$bvToast.toast('没有识别到好感度进度条', {
                        title: '错误',
                        variant: 'danger',//danger,warning,info,primary,secondary,default
                        solid: true
                    });
                    return;
                }
                let mBg = middleColor(bgs);

                let big = [];
                let l5c = 0;
                this.point.x3 = 0;
                for (let x = maxX+1,size=points.length;x<size;x++){
                    // let d = diff(points[x-1][y],points[x][y]);
                    // // console.log(diff(points[maxX+1][y],points[x][y]),diff(target,points[x][y]),x,y,points[x][y])
                    // console.log(diff(mBg,points[x][y]),mBg,x,y,points[x][y])
                    // if (d>2){
                    //     big.push(x);
                    // }
                    let d = diff(mBg,points[x][y]);
                    // console.log(d,mBg,x,y,points[x][y])
                    let tolerance = 8;
                    let tc = 4;
                    switch (this.tolerance){
                        case 1:
                            tolerance = 5;
                            tc = 5;
                            break;
                        case 2:
                            tolerance = 8;
                            tc = 4;
                            break;
                        case 3:
                            tolerance = 10;
                            tc = 3;
                            break;
                    }
                    if (d<tolerance){
                        l5c++
                        if (l5c>=tc){
                            this.point.x3 = x-5;
                            break;
                        }
                    }else {
                        l5c=0;
                    }
                }
                // if (big.length<2){
                //     //识别失败
                //     this.$bvToast.toast('识别失败，请确认截图无误，如确认截图无误请向作者反馈', {
                //         title: '错误',
                //         variant: 'danger',//danger,warning,info,primary,secondary,default
                //         solid: true
                //     });
                //     this.point.x1 = 0;
                //     this.point.x2 = 0;
                //     this.point.x3 = 0;
                // } else if (big.length===2 || big[0]+1===big[1] && big[1]+1!==big[2]){
                //     //连续2个大差距的（经验已满）
                //     this.$bvToast.toast('好感经验已满', {
                //         title: '提示',
                //         variant: 'primary',//danger,warning,info,primary,secondary,default
                //         solid: true
                //     });
                //     this.point.x1 = 0;
                //     this.point.x2 = 1;
                //     this.point.x3 = 1;
                // }else {
                //     //连续3个大差距的/第一个大差距，然后有一段小差距，接着连续2个大差距
                //     this.point.x1 = minX;
                //     this.point.x2 = maxX;
                //     this.point.x3 = big[1];
                // }
                if (this.point.x3===0){
                    this.$bvToast.toast('识别失败，请确认截图无误，如确认截图无误请向作者反馈', {
                        title: '错误',
                        variant: 'danger',//danger,warning,info,primary,secondary,default
                        solid: true
                    });
                    this.point.x1 = 0;
                    this.point.x2 = 0;
                }else {
                    this.point.x1 = minX;
                    this.point.x2 = maxX;
                }
                this.calc();
            };
            img.src = URL.createObjectURL(this.file);
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
            this.file = file;
            this.loadImg();
        };
        this.$refs.canvas.ondragenter = (e) => {
            e.preventDefault();  //阻止拖入时的浏览器默认行为
            // this.$refs.canvas.border = '2px dashed red';
        };
        this.$refs.canvas.ondragover = (e) => {
            e.preventDefault();    //阻止拖来拖去的浏览器默认行为
        };
        document.addEventListener('paste', (event)=> {
            let items = event.clipboardData && event.clipboardData.items;
            let file = null;
            if (!items || items.length===0){
                this.$bvToast.toast('无法识别的内容', {
                    title: '错误',
                    variant: 'danger',//danger,warning,info,primary,secondary,default
                    solid: true
                });
                return;
            }
            if (items && items.length) {
                // 检索剪切板items
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        file = items[i].getAsFile();
                        break;
                    }
                }
            }
            if (!file){
                this.$bvToast.toast('只能粘贴图片', {
                    title: '错误',
                    variant: 'danger',//danger,warning,info,primary,secondary,default
                    solid: true
                });
                return;
            }
            this.file = file;
            this.loadImg();
            // 此时file就是剪切板中的图片文件
        });
    }
});