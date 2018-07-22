//setting up UI
controls.simulator.createSlider({
    onchange: function(percent) {
        sim.pause();
        sim.t = Math.PI * 2 * percent / 100;
        sim.render();
        controls.simulator.setPlayState(false);
    }
});
controls.simulator.createButtons({
    play: function(){sim.speed = 1; sim.play();},
    pause: function(){sim.pause();},
    stepForward: function(){
        sim.pause();
        sim.step(.1);
        controls.simulator.slider.setValue(sim.t / (2 * Math.PI) * 100);
    },
    stepBackward: function(){
        sim.pause();
        sim.step(-.1);
        controls.simulator.slider.setValue(sim.t / (2 * Math.PI) * 100);
    },
    fastForward: function() {
        sim.speed *= 1.5;
        sim.play();
    }
});
controls.grid.createButtons({
    showGrid: function(show){
        controller.grid.showGrid = show;
    },
    showAxes: function(show){
        controller.grid.showAxes = show;
    },
    showPath: function(show) {
        controller.sim.showPath = show;
    },
    showPoints: function(show) {
        controller.showPoints = show;
    }
});

var defaultExample = "Square";
var examples = {
    "Straight Line": "26ec26cA26aY26cA",
    "Square": "2wf62wdu2wbS26aY1Ga41GbG1Gdi26ec",
    "Plus Sign": "26ec26do26cA2jd22wdu2jd226cA26bM26aY26bM26cA1Tc81GbG1Tc826cA26do",
    "Letter B": "1SbS2dgj2m5B2hoo26sJ2iql2nm52cVW1TWu1RDm",
    "Blank": "",
};
var exampleSelect = document.getElementById("example-select");
exampleSelect.addEventListener("change", function(){
    var code = examples[exampleSelect.value];
    if (code) {
        controller.points = loadPoints(code);
        controller.pointsChanged();
    }
});
exampleSelect.options[0] = new Option("Custom", "Custom");
var i = 1;
for (var name in examples) {
    exampleSelect.options[i++] = new Option(name, name);
    if (name == defaultExample) {
        exampleSelect.selectedIndex = exampleSelect.options.length - 1;
    }
}

var gearSelect = document.getElementById("max-gear-select");

gearSelect.addEventListener("change", function(){
    controller.numberOfGears = parseInt(gearSelect.value, 10);
    controller.refreshSim();
});

document.getElementById("get-link").addEventListener("click", function(){
    //Turn the array of points into a minimally sized string
    //Algorithm:
    //Every point is a pair of floats, (X,Y). Due to the grid size,
    //We know every X and Y is -5 < X < 5
    //Also, due to the accuracy of clicking and dragging, more than
    //two significant figures is probably unnecessary. Therefore,
    //we can model each X (or Y) as three digits, A, B, and C (each 0-9) such that
    //X = (A - 5) + B/10 + C/100. Thus each pair is 6 digits. We append
    //All these 6 digit numbers together without separators, and 
    //base62 encode (A-Za-z0-9). In this way, 10 points = 20 floats
    //= 60 digits. log_62(10^60) = log_10(10^60)/log_10(62) = 60/log_10(62)
    // = 60 * .55 ~= 30 characters. If we instead used just toString(),
    //assuming a float is 8 charaters and we use commas and brackets,
    //we'd be at ~20 characters per point or 200 characters. So we compress
    //by ~6-7x
    //Adendum: Because javascript numbers can't hold arbitrarily
    //large precision, we actually just base62 encode each set of 6 digits
    //and pad out to 4 characters. Less compression by a bit, but easier
    //to deal with
    var points = controller.points;
    var result = "";
    points.forEach(function(point){
        var X = (point[0] + 5).toFixed(2); //X is a string
        var Y = (point[1] + 5).toFixed(2); //Y is a string
        var digits = (X + Y).replace(/\./g, '');
        console.log(digits);
        result += base62.pad(base62.encode(digits * 1), 4); //convert to #
    });
    var href = window.location.protocol + "//" + 
                window.location.host + window.location.pathname + "#" + result;
    var link = document.getElementById("sharable-link");
    link.setAttribute("href", href);
    link.textContent = href;
    document.getElementById("share-pane").style.display = "inline";
});

var loadPoints = function(code){
    if (!code) {return [];}

    var points = [];
    for (var i = 0; i <= code.length - 4; i += 4) {
        var digits = base62.decode(code.slice(i, i + 4));
        var X = Math.floor(digits/1000);
        var Y = digits % 1000;
        points.push([(X - 500)/100, (Y - 500)/100]);
    }
    return points;
};
window.addEventListener("hashchange", function(event) {
    var code = window.location.hash.replace("#","");
    exampleSelect.selectedIndex = 0;
    controller.points = loadPoints(code);
    controller.pointsChanged();
});

var code = window.location.hash.replace("#","");
if (!code) {
    code = examples[defaultExample];
} else {
    exampleSelect.selectedIndex = 0;
}
var points = loadPoints(code);

var canvas = document.getElementById("slate");
var grid = new Grid(canvas, 70);
var numberOfGears = parseInt(gearSelect.value, 10);
var controller = new GridController(grid, points, numberOfGears);

function setGearSelectCount(count) {
    for (var i = 1; i <= count; i++) {
        gearSelect.options[i - 1] = new Option(i, i);
    }
};
setGearSelectCount(points.length);
gearSelect.selectedIndex = points.length - 1;
controller.addPointsChangedHandler(function(points) {
    var oldSel = gearSelect.selectedIndex;
    var oldLen = gearSelect.options.length;

    setGearSelectCount(points.length);

    if (oldSel == oldLen - 1) {
        gearSelect.selectedIndex = points.length - 1;
    } else {
        gearSelect.selectedIndex = oldSel
    }
});

controller.sim.addRenderStep(function(){
    if (controller.sim.playing) {
        controls.simulator.slider.setValue(sim.t / (2 * Math.PI) * 100);
    }
});

controller.refreshSim();
var sim = controller.sim;
