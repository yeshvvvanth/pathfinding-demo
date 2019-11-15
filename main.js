var config = {
    width: 960,
    height: 540,
    type: Phaser.AUTO,
    parent: 'canvasHolder',
    scene: {
        create: create,
        update: update
    },
    disableContextMenu:true,
};

var game = new Phaser.Game(config);
const maxNeibhours = 3;
const range = 250;
var graphics;
// var circle;
// var mdown = false;
// var line;
const nodes = [];
const path = [];
var activeNode = null;
var dragged = null;
var radius = 20;


var start = null;
var end = null;

function Node (px,py) {
    odometer += 1;
    var tnode = {
        x: px,
        y: py,
        name: uniqueName(odometer),
        neibhours : [],
        text: null,
        from: null,
        cost: 99999999,
    }
    if(nodes.length == 0) {
        start = tnode;
    }else if(nodes.length == 1){
        end = tnode;
    }
    return tnode;
}

function create ()
{
    //game.canvas
    graphics = this.add.graphics({ fillStyle: { color: 0xffffff} });
    graphics.lineStyle(4, 0xffdc42,1);
    // circle = new Phaser.Geom.Circle(250,250, 20);
    // var line = new Phaser.Geom.Line()

    repaint();

    const adder = this.add;
    this.input.on('pointerdown',
    function (p) {
            if(p.rightButtonDown()) {
            
                // console.log ('pointer down at '+p.x+','+p.y)
                const newNode = Node(p.x,p.y)
                newNode.text  = adder.text(
                    p.x-radius*0.4, 
                    p.y-radius*0.5,newNode.name,
                    { fontSize: '24px', fill: '#f05f50',fontStyle:'bold'}
                );
                newNode.text.style.color= "#ff0000";
                nodes.push( newNode );
                computeNeibhours();
                repaint();
            }
            if(p.leftButtonDown()){
                nodes.forEach( n => {
                    const pointer={x:p.x,y:p.y};
                    if(sqDist(pointer,n) < radius * radius * Math.PI) {
                        activeNode = n;
                        dragged = n;
                    }
                });
            }
            if(p.middleButtonDown()) { 
                computePath();
                repaint();
            }
        }
    )
    this.input.on('pointerup',p => {
        { 
            dragged = null;
            console.log('pointer up !!!!!!!!!!')
        }
    } );
    this.input.on('pointermove',p => {
        if(dragged){ 
            dragged.x = p.x;
            dragged.y = p.y;
            repaint();
            computeNeibhours();
        }
    } );
}

function update ()
{
    // a += 0.015;

    // graphics.clear();
    // graphics.fillCircleShape(circle);
    // graphics.strokeCircleShape(pointerCircle);


}

function repaint () {
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.lineStyle(4, 0xaaaaaa,1);
    // graphics.lineBetween(100, 100, 600, 500);
    
    for ( let i = 0;i < nodes.length; i += 1) {
        let c = nodes[i];
        c.text.x = c.x-7;
        c.text.y = c.y-14;

        // console.log(c.name+' has '+c.neibhours.length+' neibhours')
        for ( let j = 0;j < c.neibhours.length; j += 1) {
            const ne = c.neibhours[j].node;
            // console.log('----'+ne.name)
            graphics.lineBetween(ne.x,ne.y,c.x,c.y);
        }
    }
    renderPath();
    for ( let i = 0;i < nodes.length; i += 1) {
        let c = nodes[i];
        if(start == c){graphics.fillStyle(0x00ff00);}
        else if(end == c){graphics.fillStyle(0xff0000);}
        else {graphics.fillStyle(0xffffff);}
        graphics.fillCircle(c.x,c.y,radius);
    }
    
}

var odometer = -1;



function uniqueName(odo) {
    const uniques = 26;
    const length = 1 + Math.floor((odo)/uniques);
    name = '';
    for ( let i = 0;i < length; i += 1) {
        const base =  odo % (uniques) ;
        name += String.fromCharCode(97+base);
    }

    return name;
}

function sqDist(n1,n2) {
    return (n2.x-n1.x)**2+(n2.y-n1.y)**2;
}















function computeNeibhours(){
    for ( let i = 0;i < nodes.length; i += 1) {
        const curr = nodes [i];
        curr.neibhours.splice(0);
        var closest = nodes.map( n => {return {node:n,dist:sqDist(n,curr) }} )
                        .sort( (a,b) => a.dist-b.dist );
        const maxN = Math.min(closest.length,maxNeibhours+1);
        for( let a = 1;a < maxN; a++) {
            const cl = closest[a];
            if(cl.dist < range * range || curr.neibhours.length == 0) {
                curr.neibhours.push(cl);
                
            }
        }
    }
}


function renderPath(){
    graphics.lineStyle(4, 0xffdc42,1);
    for( let i = 0;i < path.length -1; i += 1) {
        const ne = path [i];
        const c = path [i+1];
        graphics.lineBetween(ne.x,ne.y,c.x,c.y);
    }
}



const huge =99999999;

function computePath () {
    const completedPool = []
    const activePool = []
    console.log('computed path')
    path.splice(0);
    if(start && end ){
        
        nodes.forEach( n => {
            n.cost = huge;
            n.from = null;
        });
        start.cost = 0;
        activePool.push(start);

        while(true){
            const top = activePool[0];
            for(let i = 0;i < top.neibhours.length;i += 1){
                const neibhour = top.neibhours[i];
                const n = neibhour.node;
                if(!completedPool.includes(n)){
                    if(!activePool.includes(n)){activePool.push(n)}
                    const tcost = sqDist(top,n) + top.cost;
                    if( tcost < n.cost || n.from == null ){
                        n.from = top;
                        n.cost = tcost;
                    }
                }
            }
            completedPool.push(top);
            activePool.sort(leastCost);
            if( activePool[0] == end) {break;}
            activePool.splice(0,1);
        }

        curr = end;
        while(true){
            path.push(curr);
            if(curr == start ){
                break;
            }
            curr = curr.from;
        }

    }
}

function leastCost(a,b){
    return a.cost-b.cost;
}

