const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");


let backendProcess;


function startBackend() {

    let backendExe;

    if (app.isPackaged) {

        backendExe = path.join(
            process.resourcesPath,
            "backend",
            "CoffeeHubBackend.exe"
        );

    } else {

        backendExe = path.join(
            __dirname,
            "..",
            "backend",
            "dist",
            "CoffeeHubBackend.exe"
        );

    }


    console.log("Starting backend:", backendExe);


    backendProcess = spawn(
        backendExe,
        [],
        {
            windowsHide: true
        }
    );


    backendProcess.stdout.on(
        "data",
        (data) => {
            console.log(`BACKEND: ${data}`);
        }
    );


    backendProcess.stderr.on(
        "data",
        (data) => {
            console.error(`BACKEND ERROR: ${data}`);
        }
    );

}


function createWindow() {

    const win = new BrowserWindow({
        width: 1400,
        height: 900
    });


    win.loadFile(
        path.join(
            process.resourcesPath,
            "frontend",
            "index.html"
        )
    );

}


app.whenReady().then(() => {

    startBackend();

    setTimeout(() => {
        createWindow();
    }, 3000);

});


app.on("window-all-closed", () => {

    if (backendProcess) {
        backendProcess.kill();
    }

    if (process.platform !== "darwin") {
        app.quit();
    }

});