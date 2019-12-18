var config = {
    width: 960,
    height: 540,
    type: Phaser.AUTO,
    parent: 'canvasHolder',
    scene: {
        create: create,
    },
    disableContextMenu:true,
};
var game = new Phaser.Game(config);

const nodes = [];
const path = [];
const maxNeibhours = 12;
const range = 16; // Maximum distance between two nodes to be considered neibhours
var graphics;   // Phaser graphics object
var dragged = null; // the node that is being dragged by left clicking
var radius = 20;
var odometer = -1; // the number of times new node is created


var startNode = null;   // starting node
var endNode = null;     // ending node

function Node (px,py) {
    odometer += 1;
    var tnode = {
        x: px,
        y: py,
        name: uniqueName(odometer),
        neibhours : [],
        text: null,
        from: null,
        gcost: 99999999,
    }
    if(nodes.length == 0) {
        startNode = tnode;
    }else if(nodes.length == 1){
        endNode = tnode;
    }
    return tnode;
}
var adder;
function create ()
{
    // phaser specific stuff
    graphics = this.add.graphics({ fillStyle: { color: 0xffffff} });
    graphics.lineStyle(4, 0xffdc42,1);
    adder = this.add;
    
    // default nodes for starting state 

    createNode(150,120);
    createNode(650,250)
    createNode(325,80)
    createNode(500,200)
    createNode(300,300)

    repaint();

    this.input.on('pointerdown',
        function (p) {
            if(p.middleButtonDown()) {
                addNewNode(p.x,p.y);
            }
            if(p.rightButtonDown()) { 
                showPath();
            }
            if(p.leftButtonDown()){
                nodes.forEach( n => {
                    const pointer={x:p.x,y:p.y};
                    if(Dist(pointer,n) <  radius*2 ) {
                        dragged = n;
                    }
                });
            }
        
        }
    )
    this.input.on('pointerup',p => {
        { 
            dragged = null;
        }
    } );
    this.input.on('pointermove',p => {
        if(dragged){ 
            // move the node that is being dragged to the pointer location
            dragged.x = p.x;
            dragged.y = p.y;
            repaint();
            computeNeibhours();
        }
    } );
}

function createNode(px,py){
   
    const newNode = Node(px,py)

    let textColor = (newNode == startNode||newNode==endNode)?'#ffffff':'#f05f50';
    /*
     creating and adding a Phaser text element and adding its reference
     so that we can change its position by dragging
    */
    newNode.text  = adder.text(
        px-radius*0.4, 
        py-radius*0.5,newNode.name,
        { fontSize: '24px', fill: textColor,fontStyle:'bold'}
    );

    nodes.push( newNode );
    computeNeibhours();
    repaint();
}


function repaint () {
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.lineStyle(4, 0x666666,1);
    
    for ( let i = 0;i < nodes.length; i += 1) {
        let c = nodes[i];
        c.text.x = c.x-7;
        c.text.y = c.y-14;

        for ( let j = 0;j < c.neibhours.length; j += 1) {
            const ne = c.neibhours[j].node;
            dx =  (ne.x-c.x)*0.49;
            dy =  (ne.y-c.y)*0.49;
            graphics.lineBetween(c.x,c.y,c.x+dx,c.y+dy);

        }
    }
    renderPath();
    for ( let i = 0;i < nodes.length; i += 1) {
        let c = nodes[i];
        if(startNode == c){graphics.fillStyle(0x66dd00);}
        else if(endNode == c){graphics.fillStyle(0xff0000);}
        else {graphics.fillStyle(0xffffff);}
        graphics.fillCircle(c.x,c.y,radius);
    }
    
}


function uniqueName(odo) {
    const uniques = 26;
    const length = 1 + Math.floor((odo)/uniques);
    let name = '';
    for ( let i = 0;i < length; i += 1) {
        const base =  odo % (uniques) ;
        name += String.fromCharCode(97+base);
    }

    return name;
}

function Dist(n1,n2) {
    // square distance
    return Math.sqrt((n2.x-n1.x)**2+(n2.y-n1.y)**2);
}



function computeNeibhours(){
    // function to determine the traversable neibhours of each node
    path.splice(0);
    for ( let i = 0;i < nodes.length; i += 1) {
        nodes[i].neibhours.splice(0)
    }
    for ( let i = 0;i < nodes.length; i += 1) {
        const curr = nodes [i];
        var nodesByDistance = nodes.map( n => {return {node:n,cost:Dist(n,curr) }} )
                        .sort( (a,b) => a.cost-b.cost );
        const nodeCount = Math.min(nodesByDistance.length,maxNeibhours+1);
        let closest = null;
        // start from 1 cuz closest node to a node is itself
        for( let a = 1;a < nodeCount; a++) {
            const cl = nodesByDistance[a];
            if(!closest || closest.cost>cl.cost){closest = cl;}
            if(cl.cost < range * range) {
                curr.neibhours.push(cl);
            }
        }
        let lonely  = curr.neibhours.length == 0 && closest!=null;
        if(lonely){ 
            curr.neibhours.push(closest);
            closest.node.neibhours.push({node:curr,dist:Dist(curr,closest.node)});
        }
    }
}


function renderPath(){
    // function to draw the yellow path from start node to end node
    graphics.lineStyle(4, 0xffdc42,1);
    for( let i = 0;i < path.length -1; i += 1) {
        const ne = path [i];
        const c = path [i+1];
        graphics.lineBetween(ne.x,ne.y,c.x,c.y);
    }
}

const huge = 99999999;

function leastCost(a,b){
    return a.gcost-b.gcost;
}

function computePath () {
    if(hasPath()){
        console.log('There is a possible path!! :)')
    }else{
        alert('There is no possible path !!!')
        return;
    }
    const completedPool = []
    const activePool = []
    console.log('Computed path :)')
    path.splice(0);
    if(startNode && endNode ){
        
        nodes.forEach( n => {
            n.gcost = huge;
            n.from = null;
        });
        startNode.gcost = 0;
        activePool.push(startNode);

        while(true){
            const top = activePool[0];
            console.log("*** Top node: "+top.name)

            for(let i = 0;i < top.neibhours.length;i += 1){
                const neibhour = top.neibhours[i];
                const n = neibhour.node;
                if(!completedPool.includes(n)){
                    if(!activePool.includes(n)){activePool.push(n);console.log('pushed '+n.name)}
                    const costToTop = top.neibhours[i].cost;
                    const newCost = top.gcost + costToTop;
                    if( newCost < n.gcost){
                        console.log('-------')
                        console.log(n.gcost+' , '+top.gcost+", "+newCost);
                        n.from = top;
                        n.gcost = newCost;
                        console.log(top.name+' initiated '+n.name)

                    }
                }
            }
            completedPool.push(top);
            activePool.sort(leastCost);
            if(activePool[0]!=endNode){
                activePool.splice(0,1);
            }else{
                break;
            }
        }

        curr = endNode;
        while(true){
            path.push(curr);
            if(curr == startNode ){
                break;
            }
            curr = curr.from;
        }

    }
}


function showPath(){
	computePath();
	repaint();
}

function addNewNode(px=500,py=500){
	if(nodes.length>25){return;}
 	path.splice(0);
	createNode(px,py);
	repaint();
}
function hasPath(){

    let doneList = []
    let foundEnd =false;

    function scanNodes(snode){

        doneList.push(snode.name);
        if(snode == endNode ){foundEnd = true;;return true;}  

        for(let i=0;i<snode.neibhours.length;i += 1){
            let n = snode.neibhours[i].node;
            if(!doneList.includes(n.name)){
                    
                scanNodes(n);
            }
        }        
    }

    scanNodes(startNode);
    return foundEnd;
}
