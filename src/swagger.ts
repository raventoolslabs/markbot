import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';

const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const options: swaggerJSDoc.Options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Markbot API',
      version: pkg.version,
      description: 'API documentation for Markbot backend service',
    },
    servers: [
      {
        url: '/api',
        description: 'Markbot API',
      },
    ],
    tags: [
      { name: 'General', description: 'General API endpoints' },
      { name: 'Chat', description: 'Chat interaction endpoints' },
      { name: 'Google', description: 'Google Workspace integration endpoints' },
    ],
  },
  apis: ['./src/routes.ts', './src/modules/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerDocumentationOptions = {
  customSiteTitle: 'Markbot API Docs',
  customFavIcon: '/img/favicon.ico',
  customCss: `
        /* Base (Light Theme) - Default */
        body, .swagger-ui { background-color: #ffffff !important; color: #171717 !important; }
        .swagger-ui .info .title, .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3, .swagger-ui .info h4, .swagger-ui .info h5 { color: #171717 !important; }
        .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: #404040 !important; }
        .swagger-ui .scheme-container { background-color: #ffffff !important; box-shadow: none !important; border-bottom: 1px solid #e5e5e5 !important; }
        .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated { color: #171717 !important; }
        
        .swagger-ui .topbar { background-color: #065f46 !important; border-bottom: 1px solid #065f46 !important; }
        .swagger-ui .btn.authorize { color: #065f46 !important; border-color: #065f46 !important; }
        .swagger-ui .btn.authorize svg { fill: #065f46 !important; }
        .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #065f46 !important; }
        .swagger-ui .opblock.opblock-post { border-color: #065f46 !important; background: rgba(6, 95, 70, 0.1) !important; }
        
        /* Inputs & Controls (Light) */
        .swagger-ui input { background-color: #ffffff !important; color: #171717 !important; border: 1px solid #d4d4d4 !important; }
        .swagger-ui select { background-color: #ffffff !important; color: #171717 !important; border: 1px solid #d4d4d4 !important; }
        .swagger-ui .opblock .opblock-section-header { background-color: #f5f5f5 !important; color: #171717 !important; }
        .swagger-ui .tab li { color: #171717 !important; }

        /* Logo Replacement */
        .swagger-ui .topbar-wrapper .link { display: none !important; }
        .swagger-ui .topbar-wrapper::before {
            content: '';
            display: block;
            width: 200px; 
            height: 50px;
            background-image: url('/img/title_250.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: left center;
        }

        /* Dark Theme - Class Based Overrides */
        html.dark-mode body, 
        html.dark-mode .swagger-ui { background-color: #0a0a0a !important; color: #ededed !important; }
        
        html.dark-mode .swagger-ui .info .title, 
        html.dark-mode .swagger-ui .info h1, 
        html.dark-mode .swagger-ui .info h2, 
        html.dark-mode .swagger-ui .info h3, 
        html.dark-mode .swagger-ui .info h4, 
        html.dark-mode .swagger-ui .info h5 { color: #ededed !important; }
        
        html.dark-mode .swagger-ui .info p, 
        html.dark-mode .swagger-ui .info li, 
        html.dark-mode .swagger-ui .info table { color: #a1a1aa !important; }
        
        html.dark-mode .swagger-ui .scheme-container { background-color: #0a0a0a !important; box-shadow: none !important; border-bottom: 1px solid #262626 !important; }
        
        html.dark-mode .swagger-ui .opblock .opblock-summary-operation-id, 
        html.dark-mode .swagger-ui .opblock .opblock-summary-path, 
        html.dark-mode .swagger-ui .opblock .opblock-summary-path__deprecated { color: #ededed !important; }
        
        html.dark-mode .swagger-ui .topbar { background-color: #0a0a0a !important; border-bottom: 1px solid #262626 !important; }
        
        html.dark-mode .swagger-ui input { background-color: #171717 !important; color: #ededed !important; border: 1px solid #262626 !important; }
        html.dark-mode .swagger-ui select { background-color: #171717 !important; color: #ededed !important; border: 1px solid #262626 !important; }
        html.dark-mode .swagger-ui .opblock .opblock-section-header { background-color: #171717 !important; color: #ededed !important; }
        html.dark-mode .swagger-ui .tab li { color: #ededed !important; }

        html.dark-mode .swagger-ui .btn.authorize { color: #a3e635 !important; border-color: #a3e635 !important; }
        html.dark-mode .swagger-ui .btn.authorize svg { fill: #a3e635 !important; }
    `,
};
