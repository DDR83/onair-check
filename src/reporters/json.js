/** JSON report. Frame images are left out; use the HTML report to see them. */
export function renderJson(report) {
  const { images, ...rest } = report;
  return JSON.stringify(rest, null, 2) + '\n';
}
