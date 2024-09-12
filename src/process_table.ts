import { invoke } from "@tauri-apps/api/core";
import { ContextMenu } from "./context_menu";

enum sort_modes {
  none,
  pid,
  name,
  parent,
  cpu,
  mem,
}

enum direction {
  none,
  bigToSmall,
  smallToBig,
}

export class ProcessTable {
  data: any = [];
  sort_mode: sort_modes = sort_modes.none;
  sort_direction: direction = direction.none;
  menu: ContextMenu;
  lastSelected: any;

  pid_sort_btn = document.getElementById("pid_sort")!;
  name_sort_btn = document.getElementById("name_sort")!;
  memory_sort_btn = document.getElementById("memory_sort")!;
  cpu_sort_btn = document.getElementById("cpu_sort")!;
  parent_sort_btn = document.getElementById("parent_sort")!;
  search = document.getElementById("searchbox")! as HTMLInputElement;

  constructor(menu: ContextMenu) {
    this.menu = menu;
    this.update_processes();

    this.search.oninput = (_) => {
      this.render_table(this.data);
    };

    setInterval(() => {
      this.update_processes();
      console.log("updated processes");
    }, 5000);

    this.pid_sort_btn.addEventListener("click", (_: Event) => {
      this.update_filter(sort_modes.pid, this.pid_sort_btn);
      this.update_table();
    });

    this.name_sort_btn.addEventListener("click", (_: Event) => {
      this.update_filter(sort_modes.name, this.name_sort_btn);
      this.update_table();
    });

    this.cpu_sort_btn.addEventListener("click", (_: Event) => {
      this.update_filter(sort_modes.cpu, this.cpu_sort_btn);
      this.update_table();
    });

    this.memory_sort_btn.addEventListener("click", (_: Event) => {
      this.update_filter(sort_modes.mem, this.memory_sort_btn);
      this.update_table();
    });

    this.parent_sort_btn.addEventListener("click", (_: Event) => {
      this.update_filter(sort_modes.parent, this.parent_sort_btn);
      this.update_table();
    });
  }

  update_filter(mode: sort_modes, name: HTMLElement) {
    this.reset_header_names();
    if (this.sort_mode == mode) {
      this.sort_direction =
        this.sort_direction == direction.bigToSmall
          ? direction.smallToBig
          : direction.bigToSmall;
    } else {
      this.sort_mode = mode;
      this.sort_direction = direction.bigToSmall;
    }
    name.textContent =
      name.textContent! +
      (this.sort_direction == direction.smallToBig ? "↓" : "↑");
  }

  reset_header_names() {
    this.pid_sort_btn.textContent = "PID";
    this.name_sort_btn.textContent = "Name";
    this.cpu_sort_btn.textContent = "CPU (%)";
    this.memory_sort_btn.textContent = "Memory (MB)";
    this.parent_sort_btn.textContent = "Parent";
  }

  update_table() {
    switch (this.sort_mode) {
      case sort_modes.pid:
        this.sort_process_by_pid();
        break;
      case sort_modes.name:
        this.sort_process_by_name();
        break;
      case sort_modes.cpu:
        this.sort_process_by_cpu();
        break;
      case sort_modes.mem:
        this.sort_process_by_memory();
        break;
      case sort_modes.parent:
        this.sort_process_by_parent_name();
        break;
      default:
        this.render_table(this.data);
        break;
    }
  }
  async update_processes() {
    this.data = (await invoke("get_processes")) as any;
    this.update_table();
  }

  sort_process_by_pid() {
    const sorted = this.data.sort((a: any, b: any) => {
      if (this.sort_direction == direction.smallToBig) {
        return a.pid < b.pid;
      }
      return a.pid > b.pid;
    });
    this.render_table(sorted);
  }

  sort_process_by_cpu() {
    const sorted = this.data.sort((a: any, b: any) => {
      let a_i = +String(a.cpu).split(" ")[0];
      let b_i = +String(b.cpu).split(" ")[0];
      if (this.sort_direction == direction.smallToBig) {
        return a_i < b_i;
      }
      return a_i > b_i;
    });
    this.render_table(sorted);
  }

  sort_process_by_memory() {
    const sorted = this.data.sort((a: any, b: any) => {
      let a_i = +String(a.memory).split(" ")[0];
      let b_i = +String(b.memory).split(" ")[0];
      if (this.sort_direction == direction.smallToBig) {
        return a_i < b_i;
      }
      return a_i > b_i;
    });
    this.render_table(sorted);
  }

  sort_process_by_name() {
    const sorted = this.data.sort((a: any, b: any) => {
      if (this.sort_direction == direction.smallToBig) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      return !a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    this.render_table(sorted);
  }

  sort_process_by_parent_name() {
    const sorted = this.data.sort((a: any, b: any) => {
      if (this.sort_direction == direction.smallToBig) {
        return a.parent.toLowerCase().localeCompare(b.parent.toLowerCase());
      }
      return !a.parent.toLowerCase().localeCompare(b.parent.toLowerCase());
    });
    this.render_table(sorted);
  }

  render_table(data: any) {
    let table_body = document.getElementById("process_table_data");
    if (table_body != null) {
      table_body.remove();
    }
    table_body = document.createElement("tbody");
    table_body.setAttribute("id", "process_table_data");
    table_body.setAttribute("class", "divide-y divide-gray-200");
    for (var value of data) {
      if (
        !String(value.name)
          .toLowerCase()
          .includes(this.search.value.toLowerCase())
      )
        continue;
      let table_row = document.createElement("tr");
      table_row.setAttribute("id", value.pid);
      table_row.oncontextmenu = (e) => {
        if (this.lastSelected == null) {
          this.lastSelected = table_row;
          this.lastSelected.setAttribute("class", "selected");
        } else if (this.lastSelected != table_row) {
          this.lastSelected.setAttribute("class", "hover:bg-neutral-200");
          this.lastSelected = table_row;
          this.lastSelected.setAttribute("class", "selected");
        }
        this.menu.handle(+table_row.id, e);
      };
      table_row.onclick = (_) => {
        this.menu.hide();
        if (this.lastSelected == null) {
          this.lastSelected = table_row;
          this.lastSelected.setAttribute("class", "selected");
        } else if (this.lastSelected != table_row) {
          this.lastSelected.setAttribute("class", "hover:bg-neutral-200");
          this.lastSelected = table_row;
          this.lastSelected.setAttribute("class", "selected");
        }
      };
      if (this.lastSelected != null && value.pid == +this.lastSelected.id) {
        this.lastSelected = table_row;
        this.lastSelected.setAttribute("class", "selected");
      } else {
        table_row.setAttribute("class", "hover:bg-neutral-200");
      }
      let process_pid = document.createElement("th");
      process_pid.textContent = String(value.pid);
      process_pid.setAttribute(
        "class",
        "whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center",
      );
      let user_name = document.createElement("td");
      user_name.textContent = value.user;
      user_name.setAttribute(
        "class",
        "whitespace-nowrap px-4 py-2 text-gray-700 text-center",
      );
      let process_name = document.createElement("td");
      process_name.textContent = value.name;
      process_name.setAttribute(
        "class",
        "whitespace-nowrap px-4 py-2 text-gray-700 text-center",
      );
      let process_parent = document.createElement("td");
      process_parent.textContent = value.parent;
      process_parent.setAttribute(
        "class",
        "whitespace-nowrap px-4 py-2 text-gray-700 text-center",
      );
      let process_cpu_usage = document.createElement("td");
      process_cpu_usage.textContent = String(value.cpu);
      process_cpu_usage.setAttribute(
        "class",
        "whitespace-nowrap px-4 py-2 text-gray-700 text-center",
      );
      let process_memory_usage = document.createElement("td");
      process_memory_usage.textContent = String(value.memory);
      process_memory_usage.setAttribute(
        "class",
        "whitespace-nowrap px-4 py-2 text-gray-700 text-center",
      );
      table_row.appendChild(process_pid);
      table_row.appendChild(user_name);
      table_row.appendChild(process_name);
      table_row.appendChild(process_parent);
      table_row.appendChild(process_cpu_usage);
      table_row.appendChild(process_memory_usage);
      table_body.appendChild(table_row);
    }
    document.getElementById("process_table")?.appendChild(table_body);
  }
}
