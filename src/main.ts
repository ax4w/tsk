import { ContextMenu } from "./context_menu";
import { ProcessTable } from "./process_table";

window.addEventListener("DOMContentLoaded", () => {
  let menu = new ContextMenu();
  new ProcessTable(menu);
});
