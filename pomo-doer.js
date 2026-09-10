/*

Pomo-Doer! v1.0

*/

window.onload = function() {

    // load themes
    addThemes();

    // load help button
    document.getElementById("help").addEventListener("click", displayHelp);

    // To Do List onloads
    list = document.getElementById("list");
    const taskInput = document.getElementById("task-input");
    taskInput.value = "";
    taskInput.addEventListener("keyup", createMaintask);

    // clear button onload
    clearBtn = document.getElementById("clear-btn");
    clearBtn.addEventListener("click", clearTasks);

    // file io button onloads
    importBtn = document.getElementById("import-btn");
    exportBtn = document.getElementById("export-btn");
    importBtn.addEventListener("change", importList);
    exportBtn.addEventListener("click", exportList);

    // Pomodoro onloads
    workOver = new Audio("./Audio/work-over.wav");   // Removed copyrighted music that was used in offline development, added royalty-free music
    workOver.volume = 0.5;
    breakOver = new Audio("./Audio/break-over.wav");  // Removed copyrighted music that was used in offline development, added royalty-free music
    breakOver.volume = 0.5;
    timer = document.getElementById("timer");
    sprint = document.getElementById("sprint");
    progressBarInner = document.getElementById("progress-bar-inner");
    loadTimer(sprints[sprintIndex]);
    document.getElementById("startBtn").addEventListener("click", function() {
        
        if (timeLeft && paused ) { startTimer(); } 

        else if (timeLeft && !paused) { pauseTimer(); } 

    });

    document.getElementById("skip").addEventListener("click", skip);

    // web storage test/onload
    if (typeof(Storage) !== "undefined") {
        if (localStorage.storedTasks) {

            let storedTasks = (localStorage.getItem("storedTasks"));
            tasks = JSON.parse(storedTasks);
            if (tasks.length) {
                clearBtn.hidden = false;
            }

            updateTasks();
        } else {
            console.log('no tasks in local storage');
        }

    } else {
        console.log("Zip on web storage");
    }

}

// themes
let themes = [
    // label, background color, text/buttons color, highlight color, background img
    ['Pomo', '#8b0000', '#ffebcd', '#ffcd83', 'url(./Pomo.png)'], 
    ['Dark', '#242424', '#f1ff87', '#d2d201', 'url(./Dark.png)'], 
    ['Notepad', '#dbcea5ff', '#242424', '#474747ff', 'url(./sketch.png)']
];

function addThemes() {
    for (let i = 0; i < themes.length; i++) {
        let div = document.createElement("div");
        div.id = [i] + '-' + themes[i][0] + '-theme';
        let divLabel = document.createTextNode(themes[i][0]);
        div.appendChild(divLabel);
        // attach additional styling
        div.style.backgroundImage = themes[i][4];
        div.style.backgroundColor = themes[i][1];
        div.style.color = themes[i][2];
        div.style.border = '5px solid ' + themes[i][2];

        div.addEventListener("click", loadTheme);
        document.getElementById("themes").appendChild(div);
    }
}

function loadTheme() {
    let id = this.id.split("-");
    id = id[0];
    document.body.style.setProperty("--pomoBackground", themes[id][1]);
    document.body.style.setProperty("--pomoColor", themes[id][2]);
    document.body.style.setProperty("--pomoHighlight", themes[id][3]);
    document.body.style.setProperty("--pomoWallpaper", themes[id][4]);
}

// Help button
function displayHelp() {
    window.alert("Welcome to Pomo-Doer!\n\nUse the timer on the right to time your work and break stretches!" + 
                 "\n\nEnter a task into the text field on the left and press Enter to create a task, and use the '+' button to make a subtask for that task." + 
                 "\n\nClick and drag to reorganise your tasks as you need to." +
                 "\n\nYou can press the options button next to that to edit a task you've made, or press cancel/remove the task description to delete the task!" + 
                 "\nYou can also use the export button to save your current tasklist as a local file, and load your own To Do lists using the import button!" +
                 "\n\n(You can also select a different theme using the buttons under the title!)" + 
                "\n\n Version 1.0");
}

//////////////////////////////////////////////
/////////////////////////////////////////////
// ------------- TO DO LIST -------------- //
/////////////////////////////////////////////
//////////////////////////////////////////////

// tasks
let tasks = [];
let list;

// clear button
let clearBtn;

// file io buttons
let importBtn;
let exportBtn;

// Custom classs for task items
class Task {
    constructor(desc) {
        this.finished = false;
        this.desc = desc;
    }
}

// when Enter pressed in task key box, writes task to tasks array as a new Task object
function createMaintask(e) {
    if (e.key == 'Enter' && this.value !== '') {
        const task = new Maintask(this.value);
        tasks.push(task);
        this.value = "";
        clearBtn.hidden = false;
        updateTasks();
    }
}

// Maintask child class of Task
class Maintask extends Task {
    constructor(desc) {
        super(desc);
        this.subtasks = [];
    }
}

// Subclass child class of Task
class Subtask extends Task {
    constructor(parentId, desc) {
        super(desc);
        this.parentId = Number(parentId);
    }
}

function toggle(id) {
    // length of ids is 3 if subtasks, 1 if maintask
    let ids = id.split("-");

    // block for toggling subtasks
    if (ids.length > 1) {

        // code to toggle a finished subtask to unfinished
        if (tasks[ids[0]].subtasks[ids[1]].finished) {
            tasks[ids[0]].subtasks[ids[1]].finished = false;

        // code to toggle an unfinished subtask to finished
        } else {
            tasks[ids[0]].subtasks[ids[1]].finished = true;
        }

        // counts number of completed subtasks for parent
        let completedSubtasks = 0;
        for (let i = 0; i < tasks[ids[0]].subtasks.length; i++) {
            if (tasks[ids[0]].subtasks[i].finished) {
                completedSubtasks += 1;
            }
        }
        
        // marks parent as incomplete if not all subtasks are complete
        if (completedSubtasks < tasks[ids[0]].subtasks.length) {
            tasks[ids[0]].finished = false;
            
        // marks parent task as complete if all children are complete
        } else if (completedSubtasks == tasks[ids[0]].subtasks.length) {
            tasks[ids[0]].finished = true;
        }

        // console.log(tasks);
        
    // block for toggling main tasks
    } else {

        // toggle finished task to unfinished
        if (tasks[ids[0]].finished) {
            tasks[ids[0]].finished = false;
            if (tasks[ids[0]].subtasks) {
                for (let i = 0; i < tasks[ids[0]].subtasks.length; i++) {
                    tasks[ids[0]].subtasks[i].finished = false;
                }
            }

        // toggle unfinished task to finished
        } else {
            tasks[ids[0]].finished = true;
            if (tasks[ids[0]].subtasks) {
                for (let i = 0; i < tasks[ids[0]].subtasks.length; i++) {
                    tasks[ids[0]].subtasks[i].finished = true;
                }
            }
        }

        // console.log(tasks);
    }
    updateTasks();
}

// create subtask from parent task div control
function createSubtask() {
    // get parentId from div
    let parentId = this.id.split("-");
    parentId = Number(parentId[0]);
    let desc = window.prompt(`What subtask would you like to add to task #${Number(parentId)+1}: ${tasks[parentId].desc}?`);
    if (!desc) {
        console.log("No subtask description given");
    } else {
        // create subtask with given attributes
        let subtask = new Subtask(parentId, desc);
        tasks[parentId].subtasks.push(subtask);
        console.log(tasks);
    }
    updateTasks();
}

// clears tasks in display and populates with all current elements in tasks array
function updateTasks() {

    // clear list items
    while (list.firstChild) {
        list.firstChild.remove();
    }

    // loop through tasks list, create new items, and append to DOM
    for (let i = 0; i < tasks.length; i++) {
        let div = constructMaintaskDiv(i);
        list.appendChild(div);
        if (tasks[i].subtasks) {
            for (let j = 0; j < tasks[i].subtasks.length; j++) {
                let subDiv = constructSubtaskDiv(i, j);
                list.appendChild(subDiv);
            }
        }
    }

    if (tasks.length) {
        clearBtn.hidden = false;
    } else {
        clearBtn.hidden = true;
    }

    setWebStorage();
}

function setWebStorage() {
    localStorage.setItem("storedTasks", JSON.stringify(tasks));
}

// man i really need to start using container divs or I'm going to drown in here
function constructMaintaskDiv(i) {
    // create main div, give it id. Id == element in tasks array
    let div = document.createElement("div");
    div.classList.add("task-container");
    div.id = i;
    // console.log(div.id);

    // make draggable
    div.draggable = true;
    div.addEventListener("dragstart", dragStart);
    div.addEventListener("dragover", dragOver);
    div.addEventListener("dragend", dragEnd);

    // make checkbox container
    let checkboxContainer = document.createElement("div");
    checkboxContainer.classList.add("square-container");
    // make checkbox
    let checkbox = document.createElement("input");
    checkbox.type = 'checkbox';
    checkbox.id = i + "-checkbox";
    tasks[i].finished ? checkbox.checked = true : checkbox.checked = false;
    // add event listener for toggle
    checkbox.addEventListener("click", () => { 
        toggle(div.id); 
    });
    // append checkbox to container, container to div
    checkboxContainer.appendChild(checkbox);
    div.appendChild(checkboxContainer);

    // make text container
    let textContainer = document.createElement("div");
    textContainer.classList.add("text-container");
    // make text node
    let textNode = document.createTextNode(tasks[i].desc);
    // append textnode to container, container to div
    textContainer.appendChild(textNode);
    div.appendChild(textContainer);

    // make subtask container
    let subtaskContainer = document.createElement("div");
    subtaskContainer.classList.add("square-container");
    // make subtask button
    let subtaskBtn = document.createElement("button");
    subtaskBtn.classList.add("button");
    subtaskBtn.innerHTML = '+';
    subtaskBtn.id = i + "-addSubtask";
    subtaskBtn.addEventListener("click", createSubtask);
    // append subtask button to container, container to div
    subtaskContainer.appendChild(subtaskBtn);
    div.appendChild(subtaskContainer);

    // make options container
    let optionsContainer = document.createElement("div");
    optionsContainer.classList.add("square-container");
    // make options button
    let optionsBtn = document.createElement("button");
    optionsBtn.innerHTML = "&equiv;";
    optionsBtn.id = i + "-options";
    optionsBtn.addEventListener("click", editTask);
    // append options button to container, container to div
    optionsContainer.appendChild(optionsBtn);
    div.appendChild(optionsContainer);

    // adds checked class if finished
    if (tasks[i].finished) { 
        div.classList.add("checked"); 
        div.style.backgroundColor = "#8c9297";      // this should work just from the CSS file - why is it not? Why do I have to re-define it here? 
                                                    // it works, but it should be much simpler and shouldn't require any extra code here
    }

    return div;
    // returns completed div back to updateTasks()
}

function constructSubtaskDiv(i, j) {
    // make subtask div
    let subDiv = document.createElement("div");
    subDiv.id = `${i}-${j}`; 
    subDiv.classList.add("task-container");
    subDiv.classList.add("subtask");

    // make draggable
    subDiv.draggable = true;
    subDiv.addEventListener("dragstart", dragStart);
    subDiv.addEventListener("dragover", dragOver);
    subDiv.addEventListener("dragend", dragEnd);

    // make checkbox container
    let checkboxContainer = document.createElement("div");
    checkboxContainer.classList.add("square-container");
    // make checkbox
    let checkbox = document.createElement("input");
    checkbox.type = 'checkbox';
    checkbox.id = i + "-" + j + "-checkbox";
    tasks[i].subtasks[j].finished ? checkbox.checked = true : checkbox.checked = false;
    // add event listener
    checkbox.addEventListener("click", () => {
        toggle(subDiv.id);
    });        
    // append checkbox to container, container to div
    checkboxContainer.appendChild(checkbox);
    subDiv.appendChild(checkboxContainer);

    // make text container
    let textContainer = document.createElement("div");
    textContainer.classList.add("text-container");
    // make text node
    let textNode = document.createTextNode(tasks[i].subtasks[j].desc);
    // append textnode to container, container to div
    textContainer.appendChild(textNode);
    subDiv.appendChild(textContainer);

    // make options container
    let optionsContainer = document.createElement("div");
    optionsContainer.classList.add("square-container");
    // make options button
    let optionsBtn = document.createElement("button");
    optionsBtn.innerHTML = "&equiv;";
    optionsBtn.id = i + "-" + j + "-options";
    optionsBtn.addEventListener("click", editTask);
    // append options button to container, container to div
    optionsContainer.appendChild(optionsBtn);
    subDiv.appendChild(optionsContainer);

    // subDiv.innerText = tasks[i].subtasks[j].desc;

    // this **** from earlier tests ^
    // was hiding at the end of all this construction
    // OVERWRITING EVERYTHING AT THE VERY END
    // I spent an HOUR FIGURING THIS OUT

    if (tasks[i].subtasks[j].finished) {
        subDiv.classList.add("checked");
        subDiv.style.backgroundColor = "#8c9297";
    }
    return subDiv;
}

// edit an existing task
function editTask() {

    // Stop. I know you want to make a new set of styling rules. Do not. Just use a window alert. Be kinder to yourself. 

    let currDesc;

    let index = this.id.split("-");
    if (index.length == 2) {
        currDesc = tasks[index[0]].desc;
        let newDesc = window.prompt("What would you like to change the task to? \n\nClear the task description , or click 'cancel', to delete the task", currDesc);

        if (!newDesc) {
            console.log("No desc added - deleting " + this.id);
            tasks.splice(index[0], 1);
        } else if (newDesc == currDesc) {
            console.log("Same desc - " + this.id);
        } else {      
            tasks[index[0]].desc = newDesc;
            console.log(`${this.id} - new desc added!`)
        }
    } else {
        currDesc = tasks[index[0]].subtasks[index[1]].desc;
        let newDesc = window.prompt("What would you like to change the subtask to?\n\nClear the task description, or click 'cancel' to delete the subtask", currDesc);

        if (!newDesc) {
            console.log("No desc added - deleting " + this.id);
            tasks[index[0]].subtasks.splice(index[1], 1);
        } else if (newDesc == currDesc) {
            console.log("Same desc - " + this.id);
        } else {
            tasks[index[0]].subtasks[index[1]].desc = newDesc;
            console.log(`${this.id} - new desc added!`)
        }
    }
    updateTasks();
}

function clearTasks() {
    tasks = [];
    updateTasks();
}

let subjectTask;
let targetTask;
let swappable;

function dragStart() {
    subjectTask = this.id.split("-");
    console.log("dragging entry " + subjectTask);
}

function dragOver(e) {
    e.preventDefault();
    targetTask = this.id.split("-");
    console.log("dragging over entry " + targetTask);
    if ((subjectTask.length == 2 && targetTask.length == 2) || (subjectTask.length == 1 && targetTask.length == 1)) {
        console.log("subjectTask: " + subjectTask + " || targetTask: " + targetTask + " - swappable");
        swappable = true;
    } else {
        console.log("subjectTask: " + subjectTask + " || targetTask: " + targetTask + " - not swappable");
        swappable = false;
    }
    
}

function dragEnd() {
    if (swappable) {
        // swap main tasks
        if (subjectTask.length == 1) {
            [tasks[subjectTask], tasks[targetTask]] = [tasks[targetTask], tasks[subjectTask]];

        // swap subtasks
        } else {
            [tasks[subjectTask[0]].subtasks[subjectTask[1]], tasks[targetTask[0]].subtasks[targetTask[1]]] = 
            [tasks[targetTask[0]].subtasks[targetTask[1]], tasks[subjectTask[0]].subtasks[subjectTask[1]]];
        }
        
        swappable = false;
        updateTasks();
    }
}

// import list from local file
function importList() {
    const file = importBtn.files[0];
    const reader = new FileReader();

    // file validation
    if (!file) {
        console.log("No file selected");
        return;
    }

    if (file.type !== "application/json") {
        console.log("Not a JSON file");
        return;
    }

    // setup reader event listener
    reader.addEventListener("load", () => {
        let newArray = JSON.parse(reader.result);
        const goodJSON = newArray.every(validJSON);
        console.log('goodJSON = ' + goodJSON);
        
        if (goodJSON) {
            tasks = newArray;
            updateTasks();
        } else {
            console.log("JSON file unsuitable - please select a valid JSON file");
        }
    });

    // read the file
    reader.readAsText(file);

    // test that the JSON from file matches tasks format
    function validJSON(element, index, array) {
        
        // validJSON run per array entry by every() fn
        // same logic, no loops (except subtasks)

        if (typeof(element.finished) == 'boolean' && typeof(element.desc) == 'string') {
            if (element.subtasks) {
                for (let i = 0; i < element.subtasks.length; i++) {
                    if (typeof(element.subtasks[i].finished) == 'boolean' && typeof(element.subtasks[i].desc) == 'string') {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

// export current list to local file
function exportList() {

    // convert tasks to JSON string
    let tasksJSON = JSON.stringify(tasks, null, 2);

    // create Blob containing JSON string
    let blob = new Blob([tasksJSON], { type: "application/json" });

    // create temporary download link
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.download = `pomodoer-${Date.now()}.json`;

    // attach link to document and trigger
    document.body.appendChild(link);
    link.click();

    // clean up DOM
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("Exported tasks to file!");
}

//////////////////////////////////////////////
//////////////////////////////////////////////
// ------------- POMODORO TIMER ----------- //
//////////////////////////////////////////////
//////////////////////////////////////////////

// I wonder how bored I have to be to start doing ASCII art in these

// HTML ids
let timer;
let sprint;
let progressBarInner;

// pomodoro sprint times
const workTime = 25; // 25
const shortBreak = 5; // 5
const bigBreak = 15; // 15
let fullTime;
let sprintIndex = 0; // tracks index 0-7 in sprints array
const sprints = ['Work', 'Break', 'Work', 'Break', 'Work', 'Break', 'Work', 'Big Break']; 
let sprintDisplayNumber;

// time keeping
let timeLeft = true;
let paused = true;
let minsLeft;
let secsLeft;

// sounds
let workOver;
let breakOver;

// skip current stretch
function skip() {
    // increment sprintIndex
    sprintIndex < 7 ? sprintIndex++ : sprintIndex = 0;
    // load new sprint
    resetTimer();
}

// load up the next timer interval
function loadTimer(stretch) {
    switch (stretch) {
        case 'Work': 
            minsLeft = workTime;
            fullTime = workTime*60;
            break;

        case 'Break': 
            minsLeft = shortBreak;
            fullTime = shortBreak*60;
            break;

        case 'Big Break': 
            minsLeft = bigBreak;
            fullTime = bigBreak*60;
            break;
    }

    timeLeft = true;
    secsLeft = 0;
    switch (sprintIndex) {
        case 0: 
        case 1: 
            sprintDisplayNumber = 1;
            break;
        case 2:
        case 3: 
            sprintDisplayNumber = 2;
            break;
        case 4: 
        case 5: 
            sprintDisplayNumber = 3;
            break;
        case 6: 
        case 7: 
            sprintDisplayNumber = 4;
    }
    sprint.innerText = `${sprintDisplayNumber}/4 - ${sprints[sprintIndex]}`;
    console.log(`sprintIndex #${sprintIndex} loaded: ${stretch}!`);
    updateTimerDisplay();
}

// start counting down the timer
function startTimer() {
    paused = false;
    document.getElementById("startBtn").innerText = 'Pause!';
    console.log('Timer start!');
    runTimer();
}

// timer runner
function runTimer() {

    // stop the function if the timer is paused
    if (paused) {
        console.log('paused');
        return;
    }

    if (secsLeft == 0 && minsLeft > 0) {
        minsLeft -= 1;
        secsLeft = 60;
    }
    secsLeft -= 1;
    updateTimerDisplay();

    if (secsLeft == 0 && minsLeft == 0) {
        
        if (sprints[sprintIndex] == 'Work') {
            workOver.currentTime = 0;
            workOver.play();
        }
        else {
            breakOver.currentTime = 0;
            breakOver.play();
        }

        timeLeft = false;
        document.getElementById("startBtn").innerText = "Start next sprint!";
        sprintIndex < 7 ? sprintIndex++ : sprintIndex = 0;
        console.log('Timer ran out!');
        resetTimer();
        return;
    }
    setTimeout(runTimer, 1000);
}

// pauses the timer if it is running
function pauseTimer() {
    paused = true;
    document.getElementById("startBtn").innerText = 'Resume!';
}

// resets the timer back to the start of the first sprint
function resetTimer() {
    loadTimer(sprints[sprintIndex]);
    paused = true;
    timeLeft = true;
    document.getElementById("startBtn").innerText = 'Start timer!';
    console.log("Timer reset!");
}

// updates the display for the current timer
function updateTimerDisplay() {
    if (secsLeft < 10) {
        timer.innerText = `${minsLeft}:0${secsLeft}`;
    } else {
        timer.innerText = `${minsLeft}:${secsLeft}`;
    }

    // update progress bar
    progressBarInner.style.width = findTimePercentageLeft() + '%';
}

function findTimePercentageLeft() {
    function findPercentage(progTime, fullTime) {
        if (progTime > fullTime) {
            console.log(`timer error: progTime = ${progTime}, fullTime = ${fullTime}!`);
            return;
        }
        // console.log(`progTime - ${progTime}; fullTime - ${fullTime}; percentage - ${(progTime / fullTime)*100}`);
        return (progTime / fullTime)*100; 
    }

    let timeLeftInSeconds = (minsLeft * 60) + secsLeft;
    // console.log('timeLeftInSeconds - ' + timeLeftInSeconds + ' ; fullTime - ' + fullTime);
    return findPercentage(timeLeftInSeconds, fullTime);
}
