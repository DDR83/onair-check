// Check: external network requests.
// A playout machine is usually offline or firewalled. Fonts, scripts, stylesheets and images loaded
// from the internet fail there. Requests to localhost, file: and data: URLs are fine. The renderer
// blocks external requests, so the page is rendered the way it would be offline.

export const id = 'network';
export const title = 'External network requests';
export const scope = 'page';

export function run({ requests }) {
  const external = requests.filter((r) => r.external);
  const metrics = { externalRequests: external.length, localRequests: requests.length - external.length };
  if (!external.length) {
    return { status: 'pass', message: 'No requests to the internet.', metrics };
  }
  const hosts = [...new Set(external.map((r) => new URL(r.url).host))];
  const sample = external.slice(0, 5).map((r) => `${r.type}: ${r.url}`);
  return {
    status: 'fail',
    message: `${external.length} request(s) to ${hosts.length} external host(s) (${hosts.join(', ')}); these fail offline.`,
    metrics,
    details: sample,
  };
}
