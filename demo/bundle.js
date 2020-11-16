
async function polyfill() {
    let fs = await import('fs').catch(() => {})
    if(fs) {
        // node
        globalThis.fs = fs;
    } else {
        // qjs
        
        globalThis.os = await import('os').catch(() => {})
        globalThis.std = await import('std').catch(() => {})
        
    }
    if(!('setTimeout' in globalThis)) {
        globalThis.setTimeout = os.setTimeout;
    }

    if(!('clearTimeout' in globalThis)) {
        globalThis.clearTimeout = os.clearTimeout;
    }
    

    if(!('process' in globalThis)) {
        globalThis.process = {};
        process.cwd = function() { return os.getcwd()[0]; }
    }
        

    if(!process.argv && 'scriptArgs' in globalThis)
        process.argv = ['qjs', ...scriptArgs];
}
class EventEmitter {
    constructor() {
        this.handlers = [];
    }

    connect(handler) {
        this.handlers.push(handler);
    }

    disconnect(handler) {
        let idx = this.handlers.indexOf(handler);
        if(idx>=0)
            this.handlers.splice(idx, 1);
    }

    emit(...args) {
        for(let x of this.handlers)
            x(...args);
    }
}class CoreObject {
    constructor(parent) {
        this.addProperty('parent');
        this.children = [];
        this.parent = parent? parent: null;
    }

    appendChild(child) {
        this.children.push(child);
    }

    // TODO This might have performance issue
    addProperty(name) {
        this.addSignal(`${name}Changed`);

        Object.defineProperty(this, name, {
            get: function() {
                return this[`_${name}Dirty`]? this[`_${name}Closure`](): this[`_${name}`];
            },
            set: function(val) {
                let ref = this[`_${name}`];
                if(val != ref) {
                    // this is okay, if we only pass lambda or literal
                    if(typeof val == 'function') {
                        this[`_${name}Closure`] = () => {
                            this[`_${name}Dirty`] = false;
                            return this[`_${name}`] = val();
                        };
                        this[`_${name}Dirty`] = true;
                    } else {
                        this[`_${name}`] = val;
                        this[`_${name}Dirty`] = false;
                    }
                    this[`${name}Changed`].emit();
                }
            }
        });
    }

    addSignal(name) {
        Object.defineProperty(this, name, {
            value: new EventEmitter(),
            writable: false,
            configurable: false,
            enumerable: true
        });
    }

    hasProperty(prop) {
        let desc = Object.getOwnPropertyDescriptor(this, prop);
        return desc && desc.set && desc.get && this[`_${prop}`]!==undefined;
    }

    has(name) {
        return name in this || this.hasProperty(name);
    }
}
class Item extends CoreObject {
    constructor(parent, params) {
        params = params? params: {};

        super(parent, params);
        this.addProperty('x');
        this.addProperty('y');
        this.addProperty('width');
        this.addProperty('height');
        this.addProperty('rotation');
        this.addProperty('clip');
        this.x = params && params.x? params.x: 0;
        this.y = params && params.y? params.y: 0;
        this.width = params && params.width? params.width: 0;
        this.height = params && params.height? params.height: 0;
        this.rotation = params && params.rotation? params.rotation: 0;
        this.clip = params && params.clip? params.clip: false;

    }
    draw(layer) {

let scene = layer.scene,
        ctx = scene.context;

        this.beginNode(layer);
        
        this.drawChildren(layer);
        this.endNode(layer);
    }
    beginNode(layer) {
        let x=this.x;
        let width=this.width;
        let y=this.y;
        let height=this.height;
        let rotation=this.rotation;
        let clip=this.clip;

let ctxScene = layer.scene.context;
        let ctxHit = layer.hit.context;

        ctxScene.save();
        ctxHit.save();
        ctxScene.translate(x+width/2, y+height/2);
        ctxScene.rotate(rotation * 3.14159 / 180);
        ctxHit.translate(x+width/2, y+height/2);
        ctxHit.rotate(rotation * 3.14159 / 180);

        if(clip) {
            this.outline(ctxScene);
            ctxScene.clip();

            this.outline(ctxHit);
            ctxHit.clip();
        }
    }
    endNode(layer) {

let ctxScene = layer.scene.context;
        let ctxHit = layer.hit.context;

        ctxScene.restore();
        ctxHit.restore();
    }
    outline(ctx) {
        let width=this.width;
        let height=this.height;

ctx.beginPath();
        ctx.rect(-width/2, -height/2, width, height);
    }
    drawChildren(layer) {

let ctxScene = layer.scene.context;
        let ctxHit = layer.hit.context;
        ctxScene.save();
        ctxHit.save();
        ctxScene.translate(-this.width/2, -this.height/2);
        ctxHit.translate(-this.width/2, -this.height/2);
        for(let i=0; i<this.children.length; i++) {
            if(this.children[i] instanceof Item) {
                this.children[i].draw(layer);
            }
        }
        ctxScene.restore();
        ctxHit.restore();
    }

}
    

class Rectangle extends Item {
    constructor(parent, params) {
        params = params? params: {};

        super(parent, params);
        this.addProperty('radius');
        this.addProperty('color');
        this.radius = params && params.radius? params.radius: 0;
        this.color = params && params.color? params.color: undefined;

    }
    draw(layer) {
        let width=this.width;
        let height=this.height;
        let radius=this.radius;
        let color=this.color;

let scene = layer.scene,
        ctx = scene.context;
        this.beginNode(layer);
        this.roundRect(ctx, -width/2, -height/2, width, height, radius);
        ctx.fillStyle = color;
        ctx.fill();
        
        this.drawChildren(layer);
        this.endNode(layer);
    }
    outline(ctx) {
        let width=this.width;
        let height=this.height;
        let radius=this.radius;

this.roundRect(ctx, -width/2, -height/2, width, height, radius);
    }
    roundRect(ctx,x,y,w,h,r) {

if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.arcTo(x+w, y,   x+w, y+h, r);
        ctx.arcTo(x+w, y+h, x,   y+h, r);
        ctx.arcTo(x,   y+h, x,   y,   r);
        ctx.arcTo(x,   y,   x+w, y,   r);
        ctx.closePath();
        return ctx;
    }

}
    

class Text extends Item {
    constructor(parent, params) {
        params = params? params: {};

        super(parent, params);
        this.addProperty('text');
        this.addProperty('color');
        this.text = params && params.text? params.text: '';
        this.color = params && params.color? params.color: undefined;

    }
    draw(layer) {
        let text=this.text;
        let color=this.color;

let scene = layer.scene,
        ctx = scene.context;

        let txt = ctx.measureText(text);
        this.width = txt.width
        this.height = txt.actualBoundingBoxAscent + txt.actualBoundingBoxDescent

        this.beginNode(layer);

        ctx.fillStyle = color;
        ctx.fillText(text, -this.width/2, this.height/2);
        
        this.drawChildren(layer);
        this.endNode(layer);
    }

}
    

class MouseArea extends Item {
    constructor(parent, params) {
        params = params? params: {};

        super(parent, params);
        this.addSignal('positionChanged');
        this.addSignal('clicked');
        MouseArea.prototype.onCompleted.call(this);

    }
    draw(layer) {
        let width=this.width;
        let height=this.height;

let hit = layer.hit,
        ctx = hit.context;

        this.beginNode(layer);
        ctx.beginPath();
        
        ctx.rect(-width/2, -height/2, width, height);
        ctx.fillStyle = hit.getColorFromIndex(this.key);
        ctx.fill();
        
        this.drawChildren(layer);
        this.endNode(layer);
    }
    mouseMoved() {

this.positionChanged.emit();
    }
    mouseClicked() {

this.clicked.emit();
    }
    onCompleted() { 

{
        
        if(window.qml.mouseArea===undefined) {
            window.qml.mouseArea = 0
            window.qml.mouseAreas = {}
        } else
            window.qml.mouseArea++
        this.key = window.qml.mouseArea
        window.qml.mouseAreas[this.key] = this;
    }
    }

}
    

class Timer extends CoreObject {
    constructor(parent, params) {
        params = params? params: {};

        super(parent, params);
        this.addProperty('interval');
        this.addProperty('repeat');
        this.addProperty('running');
        this.addSignal('triggered');
        this.runningChanged.connect(this.onRunningChanged.bind(this));
        this.interval = params && params.interval? params.interval: 1000;
        this.repeat = params && params.repeat? params.repeat: false;
        this.running = params && params.running? params.running: false;

    }
    onRunningChanged() { 
        let running=this.running;
        let interval=this.interval;

{
        if(running) {
            let cbk = function() {
                this.triggered.emit();
                if(this.repeat)
                    setTimeout(cbk, this.interval);
            }.bind(this);
            
            this._t = setTimeout(cbk, interval);
        }
    }
    }

}
    


class App extends Item {
    constructor(parent, params) {
        params = params? params: {};

        super(parent, params);
        this.xChanged.connect(this.onXChanged.bind(this));

        class App_Rectangle_0 extends Rectangle {
            constructor(parent, params) {
                params = params? params: {};
                params.x = 100;
                params.y = 100;
                params.width = 100;
                params.height = 100;
                params.color = 'black';
                params.radius = 10;

                super(parent, params);

                class App_Rectangle_0_Text_0 extends Text {
                    constructor(parent, params) {
                        params = params? params: {};
                        params.color = 'white';
                        params.text = '羅凱旋';
                        params.rotation = 45;

                        super(parent, params);

                    }

                }
    

                class App_Rectangle_0_MouseArea_1 extends MouseArea {
                    constructor(parent, params) {
                        params = params? params: {};
                        params.width = 100;
                        params.height = 100;

                        super(parent, params);
                        this.clicked.connect(this.onClicked.bind(this));

                    }
                    onClicked() { 

{
                console.log('耖')
                this.parent.color = "red"
            }
                    }

                }
    

                class App_Rectangle_0_Timer_2 extends Timer {
                    constructor(parent, params) {
                        params = params? params: {};
                        params.running = true;
                        params.repeat = true;
                        params.interval = 100;

                        super(parent, params);
                        this.triggered.connect(this.onTriggered.bind(this));

                    }
                    onTriggered() { 

{
                this.parent.rotation+=10;
            }
                    }

                }
    
                this.appendChild(new App_Rectangle_0_Text_0(this));
                this.appendChild(new App_Rectangle_0_MouseArea_1(this));
                this.appendChild(new App_Rectangle_0_Timer_2(this));

            }

        }
    
        this.appendChild(new App_Rectangle_0(this));

    }
    onXChanged() { 

{
        console.log(this.x)
    }
    }

}
    

polyfill().then(() => {
    window.qml = {};
    window.qml.rootObject = new App();
});
