// js/ui.js

// Importa las clases necesarias de sus respectivos módulos
import { DatabaseManager } from './db.js';
import { ModalRenderer } from './renderers/ModalRenderer.js';

/**
 * Clase que gestiona toda la interfaz de usuario.
 * Se encarga de la navegación, el renderizado de datos, y los eventos.
 */
export class UIManager {
    constructor(db) {
        this.db = db;
        this.appContent = document.getElementById('app-content');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.activeModule = null;

        // Variables para los gráficos
        this.analysisChart = null; // Instancia del gráfico de análisis de gastos
        this.portfolioChart = null; // Instancia del gráfico de portafolio

        // Instancia del nuevo renderizador de modales
        this.modalRenderer = new ModalRenderer(this.formatCurrency); 

        // Referencias a los modales
        this.modals = {
            'project-modal': document.getElementById('project-modal'),
            'expense-modal': document.getElementById('expense-modal'),
            'sale-modal': document.getElementById('sale-modal'),
            'confirmation-modal': document.getElementById('confirmation-modal')
        };
        
        // Cierra los modales al hacer clic fuera del contenido
        Object.values(this.modals).forEach(modal => {
            modal.addEventListener('click', (e) => {
                // Solo cerrar si se hace clic directamente en el fondo del modal
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    /**
     * Establece las referencias a los otros módulos de la aplicación.
     * @param {object} modules - Objeto con las instancias de los módulos.
     */
    setModules(modules) {
        this.projectModule = modules.projectModule;
        this.expenseModule = modules.expenseModule;
        this.reportModule = modules.reportModule;
        this.configModule = modules.configModule;
    }

    /**
     * Navega entre las diferentes secciones de la aplicación.
     * @param {string} pageId - El ID del botón de navegación.
     */
    async navigateTo(pageId) {
        this.appContent.innerHTML = `
            <div class="text-center p-8">
                <i class="fas fa-spinner fa-spin text-5xl text-blue-500"></i>
                <p class="mt-4 text-slate-600">Cargando...</p>
            </div>
        `;
        this.setActiveNav(pageId);
        window.scrollTo(0, 0);

        switch (pageId) {
            case 'nav-dashboard':
                await this.renderDashboard();
                break;
            case 'nav-history':
                await this.renderHistory();
                break;
            case 'nav-reports':
                await this.renderReports();
                break;
            case 'nav-config':
                await this.renderConfig();
                // Limpiar el formulario de categoría después de renderizar
                const categoryNameInput = document.getElementById('category-name');
                if (categoryNameInput) {
                    categoryNameInput.value = '';
                }
                break;
        }
    }

    /**
     * Establece el botón de navegación activo.
     * @param {string} activeId - El ID del botón activo.
     */
    setActiveNav(activeId) {
        this.navButtons.forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white', 'font-medium');
            btn.classList.add('bg-slate-900', 'text-white');
        });
        document.getElementById(activeId).classList.add('bg-blue-500', 'text-white', 'font-medium');
        document.getElementById(activeId).classList.remove('bg-slate-900');
    }

    //
    // Renderizado de Secciones de la UI
    //

    async renderDashboard() {
        const projects = await this.db.getDocumentsByField('projects', 'isClosed', false);
        this.appContent.innerHTML = this._renderDashboardContent(projects);
        this._attachDashboardEvents();
    }

    async renderHistory() {
        const projects = await this.db.getDocumentsByField('projects', 'isClosed', true);
        this.appContent.innerHTML = this._renderHistoryContent(projects);
        this._attachHistoryEvents();
    }

    async renderReports() {
        const projects = await this.db.getAllDocuments('projects');
        const metrics = await this.reportModule.calculatePortfolioMetrics(projects);
        this.appContent.innerHTML = this._renderReportsContent(metrics);
        this._attachReportsEvents(metrics);
    }

    async renderConfig() {
        const categories = await this.db.getAllDocuments('categories');
        this.appContent.innerHTML = this._renderConfigContent(categories);
        this._attachConfigEvents();
    }

    //
    // Lógica Específica para cada vista
    //

    async loadProjectDetails(projectId) {
        const project = await this.db.getDocument('projects', projectId);
        const expenses = await this.db.getDocumentsByField('expenses', 'projectId', project.id);
        this.appContent.innerHTML = this._renderProjectDetails(project, expenses);
        this._attachProjectDetailsEvents(projectId);
        // Siempre llamar a _updateAnalysisCharts, la lógica interna gestionará la visibilidad
        this._updateAnalysisCharts(project, expenses);
    }

    //
    // Métodos privados para renderizar HTML (usando template literals)
    //

    _renderDashboardContent(projects) {
        return `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-slate-800">Proyectos Activos <i class="fas fa-list-check text-blue-500"></i></h2>
                <button id="add-project-btn" class="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors shadow-md">
                    <i class="fas fa-plus mr-2"></i> Nuevo Proyecto
                </button>
            </div>
            ${projects.length > 0 ? this._renderProjectTable(projects) : '<p class="text-center text-slate-500 mt-12">No hay proyectos activos. ¡Añade uno para empezar!</p>'}
        `;
    }

    _renderHistoryContent(projects) {
        return `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-slate-800">Historial de Proyectos <i class="fas fa-archive text-blue-500"></i></h2>
            </div>
            ${projects.length > 0 ? this._renderProjectTable(projects, true) : '<p class="text-center text-slate-500 mt-12">No hay proyectos en el historial.</p>'}
        `;
    }

    _renderReportsContent(metrics) {
        const monthlyData = metrics.monthlyProfit;
        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(label => monthlyData[label]);

        // Helper para renderizar métricas por tipo
        const renderMetricsByType = (data, formatFn, unit = '') => {
            if (Object.keys(data).length === 0) {
                return '<p class="text-sm text-slate-500">No hay datos disponibles por tipo de propiedad.</p>';
            }
            return `
                <ul class="list-disc list-inside space-y-1 text-slate-700">
                    ${Object.entries(data).map(([type, value]) => `
                        <li><span class="font-medium capitalize">${type}:</span> ${formatFn(value)}${unit}</li>
                    `).join('')}
                </ul>
            `;
        };

        return `
            <h2 class="text-2xl font-semibold text-slate-800 mb-6">Reportes y Análisis <i class="fas fa-chart-line text-blue-500"></i></h2>
            
            <!-- Resumen General del Portafolio -->
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold mb-4 text-slate-800">Resumen General del Portafolio</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-blue-800">Capital Total Desplegado</p>
                        <p class="text-2xl font-bold text-blue-900 mt-1">${this.formatCurrency(metrics.totalCapitalDeployed)}</p>
                    </div>
                    <div class="bg-emerald-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-emerald-800">Inversión Realizada (Cerrados)</p>
                        <p class="text-2xl font-bold text-emerald-900 mt-1">${this.formatCurrency(metrics.totalInvestmentRealized)}</p>
                    </div>
                    <div class="bg-emerald-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-emerald-800">Ganancia Neta Realizada</p>
                        <p class="text-2xl font-bold text-emerald-900 mt-1">${this.formatCurrency(metrics.totalProfitRealized)}</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-purple-800">Proyectos Cerrados</p>
                        <p class="text-2xl font-bold text-purple-900 mt-1">${metrics.closedProjectsCount}</p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-yellow-800">Capital Comprometido (Activos)</p>
                        <p class="text-2xl font-bold text-yellow-900 mt-1">${this.formatCurrency(metrics.capitalEmployedActiveProjects)}</p>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-blue-800">Margen de Ganancia del Portafolio</p>
                        <p class="text-2xl font-bold text-blue-900 mt-1">${metrics.portfolioProfitMargin.toFixed(2)}%</p>
                    </div>
                    <div class="bg-emerald-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-emerald-800">ROI Promedio del Portafolio</p>
                        <p class="text-2xl font-bold text-emerald-900 mt-1">${metrics.averageROI.toFixed(2)}%</p>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-purple-800">Tiempo Promedio Cierre (Días)</p>
                        <p class="text-2xl font-bold text-purple-900 mt-1">${metrics.averageTimeToCloseProject.toFixed(0)}</p>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <p class="text-sm font-medium text-yellow-800">Ganancia Promedio por Proyecto</p>
                        <p class="text-2xl font-bold text-yellow-900 mt-1">${this.formatCurrency(metrics.averageProfitPerProject)}</p>
                    </div>
                </div>
            </div>

            <!-- Gráfico de Ganancia Mensual -->
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold mb-4 text-slate-800">Ganancia Neta Mensual del Portafolio</h3>
                <div class="relative h-80">
                    <canvas id="portfolioChart"></canvas>
                    <div id="no-portfolio-data" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 text-center text-slate-500 p-4 hidden">
                        No hay datos de proyectos cerrados para generar este gráfico.
                    </div>
                </div>
            </div>

            <!-- Métricas por Tipo de Propiedad -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4 text-slate-800">Margen de Ganancia por Tipo de Propiedad</h3>
                    ${renderMetricsByType(metrics.profitMarginByType, (val) => val.toFixed(2), '%')}
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4 text-slate-800">Tiempo Promedio de Cierre por Tipo (Días)</h3>
                    ${renderMetricsByType(metrics.averageTimeToCloseByType, (val) => val.toFixed(0), ' días')}
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md col-span-1 md:col-span-2">
                    <h3 class="text-xl font-semibold mb-4 text-slate-800">Distribución de Proyectos por Tipo</h3>
                    ${renderMetricsByType(metrics.projectDistributionByType, (val) => val, ' proyectos')}
                </div>
            </div>

            <!-- Análisis y Recomendaciones del Experto -->
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold mb-4 text-slate-800">Análisis y Recomendaciones del Experto</h3>
                <div class="prose max-w-none text-slate-700">
                    ${this._renderExpertFinancialAnalysis(metrics)}
                </div>
            </div>
        `;
    }

    _renderConfigContent(categories) {
        return `
            <h2 class="text-2xl font-semibold text-slate-800 mb-6">Configuración <i class="fas fa-cog text-blue-500"></i></h2>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-4">Categorías de Gastos</h3>
                <div id="categories-list" class="space-y-4 mb-6">
                    ${categories.map(cat => `
                        <div class="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <span class="text-lg text-slate-700">${cat.name}</span>
                            <button class="delete-category-btn text-red-500 hover:text-red-700 transition-colors" data-id="${cat.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <form id="add-category-form" class="flex gap-4">
                    <input type="text" id="category-name" placeholder="Nueva categoría..." required
                        class="flex-grow p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-md">
                        <i class="fas fa-plus"></i> Añadir
                    </button>
                </form>
            </div>
        `;
    }

    _renderProjectTable(projects, isHistory = false) {
        return `
            <div class="overflow-x-auto bg-white rounded-lg shadow-md">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto de Venta</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${projects.map(project => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${project.name}</div>
                                    <div class="text-sm text-gray-500">${project.location}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(project.createdAt).toLocaleDateString()}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${project.saleAmount ? this.formatCurrency(project.saleAmount) : 'N/A'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button class="view-project-btn text-blue-600 hover:text-blue-900 mr-4" data-id="${project.id}">
                                        ${isHistory ? '<i class="fas fa-search-plus"></i> Ver Detalle' : '<i class="fas fa-eye"></i> Ver Detalle'}
                                    </button>
                                    ${!project.isClosed ? `
                                        <button class="close-project-btn text-emerald-600 hover:text-emerald-900" data-id="${project.id}">
                                            <i class="fas fa-box-archive"></i> Cerrar
                                        </button>
                                    ` : `
                                        <!-- Botón Reabrir Proyecto -->
                                        <button class="reopen-project-btn text-purple-600 hover:text-purple-900" data-id="${project.id}">
                                            <i class="fas fa-folder-open"></i> Reabrir
                                        </button>
                                    `}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    _renderProjectDetails(project, expenses) {
        return `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-slate-800">Detalle del Proyecto: ${project.name}</h2>
                <button id="back-to-dashboard-btn" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-300 transition-colors">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Información del Proyecto</h3>
                    <p><strong>Ubicación:</strong> ${project.location}</p>
                    <p><strong>Metros Cuadrados:</strong> ${project.squareMeters}</p>
                    <p><strong>Fecha de Remate:</strong> ${project.auctionDate}</p>
                    <p><strong>Monto de Venta:</strong> ${project.saleAmount ? this.formatCurrency(project.saleAmount) : 'N/A'}</p>
                    <p><strong>Estado:</strong> ${project.isClosed ? '<span class="text-emerald-500">Cerrado</span>' : '<span class="text-blue-500">Activo</span>'}</p>
                    <div class="mt-4 flex gap-2">
                         ${!project.isClosed ? `
                            <button id="open-expense-modal-btn" data-id="${project.id}" class="bg-emerald-500 text-white px-4 py-2 rounded-full hover:bg-emerald-600 transition-colors text-sm">
                                <i class="fas fa-money-bill-wave"></i> Añadir Gasto
                            </button>
                            <button id="open-sale-modal-btn" data-id="${project.id}" class="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors text-sm">
                                <i class="fas fa-sack-dollar"></i> Registrar Venta
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-xl font-semibold mb-4">Análisis Financiero</h3>
                    <div id="project-metrics">
                        <!-- Las métricas se renderizarán aquí después de la carga -->
                        <p class="text-slate-500">Cargando métricas...</p>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold mb-4">Gastos del Proyecto</h3>
                <div class="overflow-x-auto">
                    ${expenses.length > 0 ? this._renderExpenseTable(expenses, project.id) : '<p class="text-center text-slate-500 mt-4">No hay gastos registrados para este proyecto.</p>'}
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold mb-4">Visualización</h3>
                <div class="relative h-80"> <!-- Contenedor con altura definida para el gráfico -->
                    <canvas id="analysisChart"></canvas>
                    <div id="no-analysis-data" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 text-center text-slate-500 p-4 hidden">
                        No hay gastos registrados para generar este gráfico.
                    </div>
                </div>
            </div>
        `;
    }

    // CAMBIO AQUÍ: Añadir projectId como parámetro para los botones de eliminar
    _renderExpenseTable(expenses, projectId) {
        return `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="expenses-table-body">
                    ${expenses.map(expense => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${expense.description}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${expense.category}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${expense.date}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">${this.formatCurrency(expense.amount)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button class="delete-expense-btn text-red-600 hover:text-red-900" data-id="${expense.id}" data-project-id="${projectId}">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    //
    // Métodos para el manejo de Modales (AHORA LLAMAN A MODALRENDERER)
    //

    openModal(modalId, content = '') {
        const modal = this.modals[modalId];
        if (modal) {
            // Usa el ModalRenderer para obtener el contenido
            let modalContentHtml = '';
            switch (modalId) {
                case 'project-modal':
                    modalContentHtml = this.modalRenderer.renderProjectModalContent();
                    break;
                case 'expense-modal':
                    // Necesita las categorías, las obtenemos antes de renderizar
                    this.db.getAllDocuments('categories').then(categories => {
                        modalContentHtml = this.modalRenderer.renderExpenseModalContent(content, categories); // 'content' aquí es el projectId
                        modal.innerHTML = modalContentHtml;
                        modal.querySelector('.close-modal-btn')?.addEventListener('click', () => this.closeModal(modalId));
                        modal.classList.remove('hidden');
                        // Añadimos un pequeño retraso para que la transición de Tailwind tenga tiempo de aplicarse
                        setTimeout(() => {
                            modal.querySelector('.modal-content')?.classList.add('scale-100', 'opacity-100');
                        }, 10);
                        this._attachExpenseModalEvents(content); // Adjuntar eventos después de renderizar
                    });
                    return; // Salir para evitar que se ejecute el resto del openModal
                case 'sale-modal':
                    modalContentHtml = this.modalRenderer.renderSaleModalContent(content); // 'content' aquí es el projectId
                    break;
                case 'confirmation-modal':
                    // content es un objeto { message, confirmAction, itemId, extraData }
                    modalContentHtml = this.modalRenderer.renderConfirmationModalContent(content.message, content.confirmAction, content.itemId, content.extraData);
                    break;
                default:
                    modalContentHtml = content; // Si no es un modal conocido, usa el contenido pasado directamente
            }

            modal.innerHTML = modalContentHtml; // Siempre actualizar el contenido
            // Asegurarse de que el botón de cerrar exista antes de añadir el listener
            modal.querySelector('.close-modal-btn')?.addEventListener('click', () => this.closeModal(modalId));
            modal.classList.remove('hidden');
            // Añadimos un pequeño retraso para que la transición de Tailwind tenga tiempo de aplicarse
            setTimeout(() => {
                modal.querySelector('.modal-content')?.classList.add('scale-100', 'opacity-100');
            }, 10);
        }
    }

    closeModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            // Iniciamos la animación de salida
            modal.querySelector('.modal-content')?.classList.remove('scale-100', 'opacity-100');
            modal.querySelector('.modal-content')?.classList.add('scale-95', 'opacity-0');

            // Esperamos a que termine la animación antes de ocultar y limpiar
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.innerHTML = ''; 
            }, 300); // Coincide con la duración de la transición en Tailwind
        }
    }

    //
    // Eventos
    //

    _attachDashboardEvents() {
        document.getElementById('add-project-btn')?.addEventListener('click', () => {
            this.openModal('project-modal'); 
            this._attachProjectModalEvents();
        });
        document.querySelectorAll('.view-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.loadProjectDetails(e.currentTarget.dataset.id);
            });
        });
        document.querySelectorAll('.close-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.id;
                this.openModal('confirmation-modal', {
                    message: '¿Estás seguro de que quieres cerrar este proyecto? Los proyectos cerrados se moverán al historial.',
                    confirmAction: 'closeProject',
                    itemId: projectId
                });
                this._attachConfirmationModalEvents();
            });
        });
    }

    _attachHistoryEvents() {
        document.querySelectorAll('.view-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.loadProjectDetails(e.currentTarget.dataset.id);
            });
        });
        // CAMBIO AQUÍ: Event listener para el botón Reabrir Proyecto
        document.querySelectorAll('.reopen-project-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.id;
                this.openModal('confirmation-modal', {
                    message: '¿Estás seguro de que quieres reabrir este proyecto? Volverá a estar activo en el Dashboard.',
                    confirmAction: 'reopenProject', // Nueva acción de confirmación
                    itemId: projectId
                });
                this._attachConfirmationModalEvents();
            });
        });
    }
    
    _attachProjectDetailsEvents(projectId) {
        document.getElementById('back-to-dashboard-btn')?.addEventListener('click', () => this.navigateTo('nav-dashboard'));
        
        const openExpenseBtn = document.getElementById('open-expense-modal-btn');
        if (openExpenseBtn) {
            openExpenseBtn.addEventListener('click', async () => {
                this.openModal('expense-modal', projectId); 
            });
        }

        const openSaleBtn = document.getElementById('open-sale-modal-btn');
        if (openSaleBtn) {
            openSaleBtn.addEventListener('click', async () => {
                this.openModal('sale-modal', projectId); 
                this._attachSaleModalEvents(projectId);
            });
        }

        // CAMBIO AQUÍ: Event listener para los botones de eliminar gasto
        const expensesTableBody = document.getElementById('expenses-table-body');
        if (expensesTableBody) {
            expensesTableBody.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.delete-expense-btn');
                if (deleteButton) {
                    const expenseId = deleteButton.dataset.id;
                    const currentProjectId = deleteButton.dataset.projectId; // Obtener el projectId
                    this.openModal('confirmation-modal', {
                        message: '¿Estás seguro de que quieres eliminar este gasto? Esta acción es irreversible.',
                        confirmAction: 'deleteExpense', // Nueva acción de confirmación
                        itemId: expenseId,
                        extraData: { projectId: currentProjectId } // Pasar el projectId como extraData
                    });
                    this._attachConfirmationModalEvents();
                }
            });
        }
    }

    _attachConfigEvents() {
        document.getElementById('add-category-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoryNameInput = document.getElementById('category-name');
            const categoryName = categoryNameInput.value;
            await this.configModule.handleAddCategory(categoryName);
        });

        document.getElementById('categories-list')?.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-category-btn')) {
                const button = e.target.closest('.delete-category-btn');
                const categoryId = button.dataset.id;
                this.openModal('confirmation-modal', {
                    message: '¿Estás seguro de que quieres eliminar esta categoría? Si tiene gastos asociados, no se eliminará.',
                    confirmAction: 'deleteCategory',
                    itemId: categoryId
                });
                this._attachConfirmationModalEvents();
            }
        });
    }

    _attachProjectModalEvents() {
        document.getElementById('add-project-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const projectData = {
                name: formData.get('name'),
                type: formData.get('type'),
                location: formData.get('location'),
                squareMeters: parseFloat(formData.get('squareMeters')),
                auctionDate: formData.get('auctionDate'),
                isClosed: false,
                saleAmount: null
            };
            await this.projectModule.handleAddProject(projectData);
        });
    }

    _attachExpenseModalEvents(projectId) {
        document.getElementById('add-expense-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const expenseData = {
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                category: formData.get('category'),
                date: formData.get('date'),
                projectId: projectId // Asegurarse de que el gasto se asocie al proyecto
            };
            await this.expenseModule.handleAddExpense(projectId, expenseData);
        });
    }
    
    _attachSaleModalEvents(projectId) {
        document.getElementById('add-sale-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const saleData = {
                saleAmount: parseFloat(formData.get('saleAmount')),
                saleDate: formData.get('saleDate')
            };
            await this.expenseModule.handleAddSale(projectId, saleData);
        });
    }

    _attachConfirmationModalEvents() {
        document.getElementById('cancel-confirm-btn')?.addEventListener('click', () => this.closeModal('confirmation-modal'));
        document.getElementById('confirm-action-btn')?.addEventListener('click', async (e) => {
            const button = e.currentTarget;
            const action = button.dataset.action;
            const itemId = button.dataset.id;
            const extraData = JSON.parse(button.dataset.extra || '{}');

            switch(action) {
                case 'closeProject':
                    await this.projectModule.handleCloseProject(itemId);
                    break;
                case 'reopenProject': // Nuevo caso para reabrir
                    await this.projectModule.handleReopenProject(itemId);
                    break;
                case 'deleteCategory':
                    await this.configModule.handleDeleteCategory(itemId);
                    break;
                case 'deleteExpense': // Nuevo caso para eliminar gasto
                    await this.expenseModule.handleDeleteExpense(itemId, extraData.projectId);
                    break;
            }
            this.closeModal('confirmation-modal');
        });
    }

    //
    // Métodos para renderizar gráficos
    //

    async _updateAnalysisCharts(project, expenses) {
        const metrics = await this.reportModule.calculateProjectMetrics(project);
        const expensesByCategory = metrics.expensesByCategory;
        const analysisChartCanvas = document.getElementById('analysisChart');
        const noAnalysisDataMessage = document.getElementById('no-analysis-data');

        // Actualizar métricas del proyecto
        const metricsHtml = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-medium text-slate-600">Costo Total</p>
                    <p class="text-2xl font-bold text-slate-800">${this.formatCurrency(metrics.totalCost)}</p>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-medium text-slate-600">Ganancia Bruta</p>
                    <p class="text-2xl font-bold text-slate-800">${this.formatCurrency(metrics.grossProfit)}</p>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-medium text-slate-600">Margen de Ganancia</p>
                    <p class="text-2xl font-bold text-slate-800">${metrics.profitMargin.toFixed(2)}%</p>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-medium text-slate-600">Costo por M²</p>
                    <p class="text-2xl font-bold text-slate-800">${this.formatCurrency(metrics.costPerSqMeter)}</p>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-medium text-slate-600">ROI del Proyecto</p>
                    <p class="text-2xl font-bold text-slate-800">${metrics.roi.toFixed(2)}%</p>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                    <p class="text-sm font-medium text-slate-600">Ganancia por M²</p>
                    <p class="text-2xl font-bold text-slate-800">${this.formatCurrency(metrics.profitPerSqMeter)}</p>
                </div>
            </div>
        `;
        document.getElementById('project-metrics').innerHTML = metricsHtml;

        // Lógica para el gráfico de análisis de gastos
        if (this.analysisChart) {
            this.analysisChart.destroy(); // Destruir instancia anterior si existe
            this.analysisChart = null; // Limpiar la referencia
        }

        if (Object.keys(expensesByCategory).length > 0) {
            // Mostrar canvas y ocultar mensaje
            if (analysisChartCanvas) analysisChartCanvas.style.display = 'block';
            if (noAnalysisDataMessage) noAnalysisDataMessage.style.display = 'none';

            if (analysisChartCanvas) { // Asegurarse de que el canvas exista antes de obtener el contexto
                const ctx = analysisChartCanvas.getContext('2d');
                this.analysisChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(expensesByCategory),
                        datasets: [{
                            data: Object.values(expensesByCategory),
                            backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a855f7'],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: 'Distribución de Gastos por Categoría' }
                        }
                    }
                });
            }
        } else {
            // Ocultar canvas y mostrar mensaje
            if (analysisChartCanvas) analysisChartCanvas.style.display = 'none';
            if (noAnalysisDataMessage) noAnalysisDataMessage.style.display = 'block';
        }
    }

    _attachReportsEvents(metrics) {
        if (this.portfolioChart) {
            this.portfolioChart.destroy(); // Destruir instancia anterior si existe
            this.portfolioChart = null; // Limpiar la referencia
        }
        
        const monthlyData = metrics.monthlyProfit;
        const labels = Object.keys(monthlyData).sort();
        const data = labels.map(label => monthlyData[label]);

        const portfolioChartCanvas = document.getElementById('portfolioChart');
        const noPortfolioDataMessage = document.getElementById('no-portfolio-data'); 

        if (labels.length > 0) {
            // Mostrar canvas y ocultar mensaje
            if (portfolioChartCanvas) portfolioChartCanvas.style.display = 'block';
            if (noPortfolioDataMessage) noPortfolioDataMessage.style.display = 'none';

            if (portfolioChartCanvas) { // Asegurarse de que el canvas exista antes de obtener el contexto
                const ctx = portfolioChartCanvas.getContext('2d');
                this.portfolioChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Ganancia Neta Mensual',
                            data: data,
                            backgroundColor: '#3b82f6',
                            borderColor: '#3b82f6',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            title: { display: true, text: 'Ganancia Neta Mensual del Portafolio' }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString('es-CO');
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } else {
            // Ocultar canvas y mostrar mensaje
            if (portfolioChartCanvas) portfolioChartCanvas.style.display = 'none';
            if (noPortfolioDataMessage) noPortfolioDataMessage.style.display = 'block';
        }
    }

    /**
     * Genera el texto del análisis financiero basado en las métricas del portafolio.
     * @param {object} metrics - Las métricas calculadas del portafolio.
     * @returns {string} - El HTML con el análisis y recomendaciones.
     */
    _renderExpertFinancialAnalysis(metrics) {
        let analysis = `
            <p class="mb-4">Como su asesor financiero inmobiliario, he analizado las métricas clave de su portafolio para ofrecerle una visión estratégica y recomendaciones para optimizar sus inversiones.</p>
            <h4 class="text-lg font-semibold text-slate-800 mb-2">1. Rentabilidad General:</h4>
            <ul class="list-disc list-inside mb-4 text-slate-700">
                <li><strong>Margen de Ganancia del Portafolio (${metrics.portfolioProfitMargin.toFixed(2)}%):</strong> Este indicador es fundamental. Un margen alto sugiere que sus proyectos están siendo eficientes en la conversión de ingresos por ventas en ganancias netas. Si es bajo, debemos revisar los costos y las estrategias de venta.</li>
                <li><strong>ROI Promedio del Portafolio (${metrics.averageROI.toFixed(2)}%):</strong> El Retorno de Inversión promedio le indica la eficiencia con la que su capital invertido está generando ganancias. Un ROI saludable es vital para el crecimiento.</li>
                <li><strong>Ganancia Promedio por Proyecto Cerrado (${this.formatCurrency(metrics.averageProfitPerProject)}):</strong> Esta métrica le da una idea del valor monetario promedio que cada proyecto exitoso aporta a su portafolio.</li>
            </ul>
        `;

        if (metrics.closedProjectsCount > 0) {
            analysis += `
                <h4 class="text-lg font-semibold text-slate-800 mb-2">2. Eficiencia Operativa:</h4>
                <ul class="list-disc list-inside mb-4 text-slate-700">
                    <li><strong>Tiempo Promedio de Cierre de Proyecto (${metrics.averageTimeToCloseProject.toFixed(0)} días):</strong> Un menor tiempo de cierre significa que su capital está inmovilizado por menos tiempo, lo que mejora la rotación de activos y la liquidez. Compare este valor con los estándares de la industria y sus propios objetivos.</li>
                </ul>
            `;
        } else {
            analysis += `
                <p class="mb-4 text-slate-600 italic">Para un análisis más profundo de la eficiencia operativa, necesitamos más proyectos cerrados con fechas de creación y venta registradas.</p>
            `;
        }

        if (Object.keys(metrics.profitMarginByType).length > 0) {
            analysis += `
                <h4 class="text-lg font-semibold text-slate-800 mb-2">3. Rendimiento por Tipo de Propiedad:</h4>
                <ul class="list-disc list-inside mb-4 text-slate-700">
            `;
            for (const type in metrics.profitMarginByType) {
                analysis += `<li><span class="font-medium capitalize">${type}:</span> Margen de Ganancia: ${metrics.profitMarginByType[type].toFixed(2)}%`;
                if (metrics.averageTimeToCloseByType[type] && metrics.averageTimeToCloseByType[type] > 0) {
                    analysis += `, Tiempo de Cierre: ${metrics.averageTimeToCloseByType[type].toFixed(0)} días`;
                }
                analysis += `</li>`;
            }
            analysis += `</ul>`;
            analysis += `<p class="mb-4">Esta segmentación es crucial. Le permite identificar qué tipos de propiedades son más rentables o se venden más rápido. Concéntrese en potenciar aquellos con mejor rendimiento y analice las causas de los de bajo rendimiento.</p>`;
        } else {
            analysis += `
                <p class="mb-4 text-slate-600 italic">No hay suficientes datos de proyectos cerrados por tipo de propiedad para un análisis segmentado de rentabilidad y eficiencia.</p>
            `;
        }

        if (Object.keys(metrics.projectDistributionByType).length > 0) {
            analysis += `
                <h4 class="text-lg font-semibold text-slate-800 mb-2">4. Diversificación del Portafolio:</h4>
                <ul class="list-disc list-inside mb-4 text-slate-700">
            `;
            for (const type in metrics.projectDistributionByType) {
                analysis += `<li><span class="font-medium capitalize">${type}:</span> ${metrics.projectDistributionByType[type]} proyectos</li>`;
            }
            analysis += `</ul>`;
            analysis += `<p class="mb-4">La distribución de sus proyectos por tipo le muestra su exposición a diferentes segmentos del mercado. Una diversificación adecuada puede mitigar riesgos.</p>`;
        }

        analysis += `
            <h4 class="text-lg font-semibold text-slate-800 mb-2">Recomendaciones Clave:</h4>
            <ul class="list-disc list-inside mb-4 text-slate-700">
                <li><strong>Optimización de Costos:</strong> Revise los gastos en proyectos con bajo margen de ganancia. ¿Hay categorías de gastos que se puedan reducir o negociar mejor?</li>
                <li><strong>Estrategia de Precios:</strong> Analice si los precios de venta están optimizados. ¿Podría obtener un mayor valor en ciertos tipos de propiedades o ubicaciones?</li>
                <li><strong>Gestión del Tiempo:</strong> Busque formas de reducir el tiempo de cierre de los proyectos. Esto libera capital más rápidamente para nuevas inversiones.</li>
                <li><strong>Enfoque en Tipos Rentables:</strong> Considere asignar más capital a los tipos de propiedad que consistentemente muestran los mejores márgenes y ROI.</li>
                <li><strong>Monitoreo Continuo:</strong> Mantenga un registro detallado de cada gasto y venta. La precisión de los datos es fundamental para un análisis efectivo.</li>
            </ul>
            <p class="mt-4">Recuerde que la información es poder. Utilice estas métricas para ajustar su estrategia y maximizar la rentabilidad de su portafolio inmobiliario.</p>
        `;

        return analysis;
    }

    /**
     * Helper para formatear un número a formato de moneda.
     * @param {number} amount - El número a formatear.
     * @returns {string} - El string formateado.
     */
    formatCurrency(amount) {
        // Asegurarse de que el monto es un número y no es NaN o Infinity
        if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
            return '$0.00'; // O cualquier valor predeterminado que prefieras
        }
        return '$' + amount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}
