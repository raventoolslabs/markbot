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
        width: 450px;
        height: 700px;
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

    // Resize Handle
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: transparent;
        z-index: 10;
        cursor: nwse-resize;
    `;

    // Position handle based on alignment
    if (config.position === 'bottom-left') {
        resizeHandle.style.top = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.cursor = 'nesw-resize';
    } else {
        resizeHandle.style.top = '0';
        resizeHandle.style.left = '0';
        resizeHandle.style.cursor = 'nwse-resize';
    }

    panel.appendChild(resizeHandle);

    // Resize Logic
    let isResizing = false;
    let initialWidth, initialHeight, initialMouseX, initialMouseY;

    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        initialWidth = panel.offsetWidth;
        initialHeight = panel.offsetHeight;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        // Remove transitions during resize for smoothness
        panel.style.transition = 'none';

        // Create an invisible overlay to capture mouse events even over iframe
        const overlay = document.createElement('div');
        overlay.id = 'resize-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999999;
            cursor: ${config.position === 'bottom-left' ? 'nesw-resize' : 'nwse-resize'};
        `;
        document.body.appendChild(overlay);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - initialMouseX;
        const deltaY = e.clientY - initialMouseY;

        // Calculate new dimensions
        // For bottom-right widget: pulling top-left means negative deltaX increases width, negative deltaY increases height
        // For bottom-left widget: pulling top-right means positive deltaX increases width, negative deltaY increases height

        let newWidth, newHeight;

        if (config.position === 'bottom-left') {
            newWidth = initialWidth + deltaX;
            newHeight = initialHeight - deltaY;
        } else {
            newWidth = initialWidth - deltaX;
            newHeight = initialHeight - deltaY;
        }

        // Constraints
        const minWidth = 300;
        const minHeight = 400;
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 100;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            panel.style.width = `${newWidth}px`;
        }
        if (newHeight >= minHeight && newHeight <= maxHeight) {
            panel.style.height = `${newHeight}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            // Restore transitions
            panel.style.transition = 'opacity 0.2s, transform 0.2s';

            const overlay = document.getElementById('resize-overlay');
            if (overlay) overlay.remove();
        }
    });

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

    // Full-screen Logic
    let isFullScreen = false;
    let preFullScreenStyles = {};

    function toggleFullScreen() {
        isFullScreen = !isFullScreen;
        if (isFullScreen) {
            // Save current styles
            preFullScreenStyles = {
                position: panel.style.position,
                width: panel.style.width,
                height: panel.style.height,
                bottom: panel.style.bottom,
                right: panel.style.right,
                left: panel.style.left,
                top: panel.style.top,
                borderRadius: panel.style.borderRadius,
                maxHeight: panel.style.maxHeight
            };

            // Apply full screen styles (Maximized with margin)
            panel.style.position = 'fixed';
            panel.style.width = 'calc(100vw - 40px)';
            panel.style.height = 'calc(100vh - 40px)';
            panel.style.top = '20px';
            panel.style.left = '20px';
            panel.style.right = '20px';
            panel.style.bottom = '20px';
            panel.style.borderRadius = '12px';
            panel.style.maxHeight = 'none';
            panel.style.zIndex = '100000';

            // Hide resize handle
            resizeHandle.style.display = 'none';
        } else {
            // Restore styles
            panel.style.position = 'absolute';
            panel.style.width = preFullScreenStyles.width;
            panel.style.height = preFullScreenStyles.height;
            panel.style.bottom = preFullScreenStyles.bottom;
            // Restore position based on config
            if (config.position === 'bottom-left') {
                panel.style.left = preFullScreenStyles.left || '0';
                panel.style.right = '';
            } else {
                panel.style.right = preFullScreenStyles.right || '0';
                panel.style.left = '';
            }
            panel.style.top = '';
            panel.style.borderRadius = preFullScreenStyles.borderRadius || '12px';
            panel.style.maxHeight = preFullScreenStyles.maxHeight;
            panel.style.zIndex = '';

            // Show resize handle
            resizeHandle.style.display = 'block';
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
            case 'widget:toggle-fullscreen':
                if (isOpen) toggleFullScreen();
                break;
            case 'widget:resize':
                // Optional: Handle dynamic resizing if needed
                break;
        }
    });

})();
