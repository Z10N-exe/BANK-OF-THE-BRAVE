(function () {
  const token = localStorage.getItem('token');
  if (!token) return;

  const style = document.createElement('style');
  style.textContent = '.support-float{position:fixed;right:22px;bottom:22px;z-index:1000;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#229ed9;color:#fff;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.22);font:700 12px Arial,sans-serif}.support-float:hover{transform:translateY(-2px);box-shadow:0 9px 24px rgba(0,0,0,.28)}.support-float svg{width:27px;height:27px;fill:currentColor}.support-float-label{position:absolute;right:64px;white-space:nowrap;background:#0a0f2e;color:#fff;padding:8px 10px;border-radius:6px;font-size:12px;opacity:0;pointer-events:none;transition:opacity .2s}.support-float:hover .support-float-label{opacity:1}@media(max-width:600px){.support-float{right:16px;bottom:16px}}';
  document.head.appendChild(style);

  fetch('/api/deposits/settings')
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      const url = data && data.supportTelegramUrl;
      if (!url || !/^https:\/\/t\.me\/[A-Za-z0-9_+\-]+$/.test(url)) return;
      const link = document.createElement('a');
      link.className = 'support-float';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', 'Contact support on Telegram');
      link.innerHTML = '<span class="support-float-label">Contact Support</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.8 3.2 2.9 10.5c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.7c.2.6.1.8.7.8.4 0 .6-.2.8-.4l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.2-15.1c.3-1.3-.5-1.9-1.7-1.4ZM8.3 13.1l10.9-6.9c.5-.3 1-.1.6.2l-8.9 8-.3 3.2-1.4-4.5-2.6-.8c-.6-.2-.6-.5.7-.9Z"/></svg>';
      document.body.appendChild(link);
    })
    .catch(() => {});
})();
