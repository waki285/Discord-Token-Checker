/** @type { { checkTokens(tokens: string[]): Promise<{ success: number, require: number, invalid: number }>, checkTokensChunk(callback: <T,>(data: string) => Awaited<T>) => void } } */
var preload = window.preload;

toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": true,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "3000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

$("#loadtoken").on("change", async (e) => {
  e.preventDefault();
  /** @type {File} */
  const file = $("#loadtoken").prop("files")[0];
  if (!file.name.endsWith(".txt")) return toastr.error("Invalid file type");
  const filen = await file.text();
  const tokens = filen.split("\n");
  toastr.success(`Loaded ${tokens.length} tokens.\nChecking...`);
  const result = await preload.checkTokens(tokens);
  toastr.info(`Checked: ${tokens.length}`, "", { timeOut: 200000 });
  toastr.success(`Success: ${result.success}`, "", { timeOut: 200000 });
  toastr.error(`Invalid: ${result.invalid}`, "", { timeOut: 200000 });
  toastr.warning(`Require: ${result.require}`, "", { timeOut: 200000 });
});

preload.checkTokensChunk((event, data) => {
  $("title").text(data.title);
})