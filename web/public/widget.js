(function () {
    // 1. Read configuration from script tag
    const script = document.currentScript;
    const config = {
        widgetId: script.getAttribute('data-widget-id'),
        token: script.getAttribute('data-token'),
        chatUrl: script.getAttribute('data-chat-url'),
        apiBase: script.getAttribute('data-api-base'),
        position: script.getAttribute('data-position') || 'bottom-right',
        theme: script.getAttribute('data-theme') || 'light'
    };

    if (!config.widgetId || !config.token || !config.chatUrl) {
        console.error('Markbot Widget: Missing required attributes (data-widget-id, data-token, data-chat-url)');
        return;
    }

    // 2. Create UI Elements
    const root = document.createElement('div');
    root.id = `markbot-${config.widgetId}`;
    root.style.cssText = `
        position: fixed;
        z-index: 99999;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    // Position logic
    if (config.position === 'bottom-left') {
        root.style.bottom = '20px';
        root.style.left = '20px';
    } else {
        root.style.bottom = '20px';
        root.style.right = '20px';
    }

    // Floating Button
    const button = document.createElement('div');
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;
    button.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 30px;
        background-color: #059669; /* Emerald 600 */
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s, background-color 0.2s;
    `;
    button.onclick = toggleChat;

    // Chat Panel (Hidden by default)
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: absolute;
        bottom: 80px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 100px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        overflow: hidden;
        display: none;
        flex-direction: column;
        transition: opacity 0.2s, transform 0.2s;
        transform: translateY(10px);
        opacity: 0;
    `;

    // Mobile Responsive
    if (window.innerWidth < 480) {
        panel.style.width = 'calc(100vw - 40px)';
        panel.style.height = 'calc(100vh - 100px)';
        if (config.position === 'bottom-left') {
            panel.style.left = '0';
        } else {
            panel.style.right = '0';
        }
    } else {
        if (config.position === 'bottom-left') {
            panel.style.left = '0';
        } else {
            panel.style.right = '0';
        }
    }

    // Iframe
    const iframe = document.createElement('iframe');
    const iframeSrc = new URL(config.chatUrl);
    iframeSrc.searchParams.set('embed', '1');
    iframeSrc.searchParams.set('widgetId', config.widgetId);
    iframeSrc.searchParams.set('theme', config.theme);
    iframeSrc.searchParams.set('token', config.token);

    iframe.src = iframeSrc.toString();
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
    `;

    panel.appendChild(iframe);
    root.appendChild(panel);
    root.appendChild(button);
    document.body.appendChild(root);

    // 3. State Management
    let isOpen = false;

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            panel.style.display = 'flex';
            // Small delay for animation
            setTimeout(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, 10);

            // Send context
            iframe.contentWindow.postMessage({
                type: "host:context",
                url: location.href,
                title: document.title,
                origin: location.origin
            }, config.chatUrl);

        } else {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(10px)';
            setTimeout(() => {
                panel.style.display = 'none';
            }, 200);
        }
    }

    // 4. Message Handling
    window.addEventListener('message', (event) => {
        // Validate origin
        const chatOrigin = new URL(config.chatUrl).origin;
        if (event.origin !== chatOrigin) return;

        const data = event.data;
        if (!data || !data.type) return;

        switch (data.type) {
            case 'widget:ready':
                // console.log('Widget is ready');
                break;
            case 'widget:close':
                if (isOpen) toggleChat();
                break;
            case 'widget:resize':
                // Optional: Handle dynamic resizing if needed
                break;
        }
    });

})();
