import { invoke } from "@tauri-apps/api/core";

export class ContextMenu {
  menu: HTMLElement;
  PID: number = -1;
  constructor() {
    this.menu = document.getElementById("context_menu")!;
    document.getElementById("kill")!.onclick = (_) => {
      this.kill();
    };
  }

  async kill() {
    console.log(this.PID);
    if (this.PID < 0) return;
    let result = await invoke("kill_process", {
      id: this.PID,
    });
    console.log("result " + result);
  }

  handle(PID: number, e: any) {
    this.PID = PID;
    e.preventDefault();
    this.menu.style.display = "block";
    let width = this.menu.offsetWidth;
    let height = this.menu.offsetHeight;
    this.menu.style.display = "";
    let y = e.pageY;
    let x = e.pageX;

    if (x + width > window.innerWidth) x = window.innerWidth - width;
    if (y + height > window.innerHeight) y = window.innerHeight - height;
    this.menu.style.left = x + "px";
    this.menu.style.top = y + "px";
    this.show();
  }

  show() {
    this.menu.classList.add("block");
    this.menu.classList.remove("hidden");
  }

  hide() {
    this.PID = -1;
    this.menu.classList.add("hidden");
    this.menu.classList.remove("block");
  }
}
