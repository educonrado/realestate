// js/main.js

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

// Espera a que el DOM esté completamente cargado antes de inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {

    // Inicializa el gestor de la base de datos
    dbManager = new DatabaseManager();

    // Inicializa los gestores de la UI y los módulos de lógica
    uiManager = new UIManager(dbManager);
    projectModule = new ProjectModule(dbManager, uiManager);
    expenseModule = new ExpenseModule(dbManager, uiManager);
    reportModule = new ReportModule(dbManager);
    configModule = new ConfigModule(dbManager, uiManager);

    // Asegura que existan categorías por defecto antes de continuar
    await configModule.ensureDefaultCategories();

    // Pasamos las referencias de los módulos a la UI para que pueda interactuar con ellos
    uiManager.setModules({ projectModule, expenseModule, reportModule, configModule });

    // Configura los eventos de los botones de navegación
    document.getElementById('nav-dashboard').addEventListener('click', () => uiManager.navigateTo('nav-dashboard'));
    document.getElementById('nav-history').addEventListener('click', () => uiManager.navigateTo('nav-history'));
    document.getElementById('nav-reports').addEventListener('click', () => uiManager.navigateTo('nav-reports'));
    document.getElementById('nav-config').addEventListener('click', () => uiManager.navigateTo('nav-config'));

    // Navega al Dashboard por defecto al cargar la aplicación
    uiManager.navigateTo('nav-dashboard');
});
