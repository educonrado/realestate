// Importa todas las clases necesarias de sus respectivos módulos
import { DatabaseManager } from './db.js';
import { UIManager } from './ui.js';
import { ProjectModule } from './projectModule.js';
import { ExpenseModule } from './expenseModule.js';
import { ReportModule } from './reportModule.js';
import { ConfigModule } from './configModule.js';

// Almacenamos las instancias de los módulos
let dbManager;
let uiManager;
let projectModule;
let expenseModule;
let reportModule;
let configModule;

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu-items');
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }
}

// Espera a que el DOM esté completamente cargado antes de inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {

    // Lógica del menú de hamburguesa para abrir/cerrar
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const mobileMenu = document.getElementById('mobile-menu-items');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Inicializa el gestor de la base de datos
    dbManager = new DatabaseManager();

    // Inicializa los gestores de la UI y los módulos de lógica
    uiManager = new UIManager(dbManager);
    projectModule = new ProjectModule(dbManager, uiManager);
    expenseModule = new ExpenseModule(dbManager, uiManager);
    reportModule = new ReportModule(dbManager);
    configModule = new ConfigModule(dbManager, uiManager);

    await configModule.ensureDefaultCategories();

    uiManager.setModules({ projectModule, expenseModule, reportModule, configModule });

    document.getElementById('nav-dashboard').addEventListener('click', () => uiManager.navigateTo('nav-dashboard'));
    document.getElementById('nav-history').addEventListener('click', () => uiManager.navigateTo('nav-history'));
    document.getElementById('nav-reports').addEventListener('click', () => uiManager.navigateTo('nav-reports'));
    document.getElementById('nav-config').addEventListener('click', () => uiManager.navigateTo('nav-config'));

    document.getElementById('nav-dashboard-mobile').addEventListener('click', () => {
        uiManager.navigateTo('nav-dashboard');
        closeMobileMenu();
    });
    document.getElementById('nav-history-mobile').addEventListener('click', () => {
        uiManager.navigateTo('nav-history');
        closeMobileMenu();
    });
    document.getElementById('nav-reports-mobile').addEventListener('click', () => {
        uiManager.navigateTo('nav-reports');
        closeMobileMenu();
    });
    document.getElementById('nav-config-mobile').addEventListener('click', () => {
        uiManager.navigateTo('nav-config');
        closeMobileMenu();
    });

    uiManager.navigateTo('nav-dashboard');
});