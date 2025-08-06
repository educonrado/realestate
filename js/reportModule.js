// js/reportModule.js

/**
 * Módulo para el cálculo de métricas y reportes financieros.
 */
export class ReportModule { // Asegúrate de que esta clase esté exportada
    /**
     * @param {DatabaseManager} db - Instancia del gestor de la base de datos.
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Calcula las métricas financieras para un proyecto individual.
     * @param {object} project - El objeto del proyecto.
     * @returns {Promise<object>} - Un objeto con las métricas del proyecto.
     */
    async calculateProjectMetrics(project) {
        const expenses = await this.db.getDocumentsByField('expenses', 'projectId', project.id);

        const totalCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const grossProfit = project.saleAmount ? (project.saleAmount - totalCost) : 0;
        const profitMargin = project.saleAmount && project.saleAmount > 0 ? (grossProfit / project.saleAmount) * 100 : 0;
        const costPerSqMeter = project.squareMeters > 0 ? totalCost / project.squareMeters : 0;
        const roi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0; // ROI para el proyecto individual
        const profitPerSqMeter = project.squareMeters > 0 ? grossProfit / project.squareMeters : 0; // Nueva métrica

        // Agrupar gastos por categoría
        const expensesByCategory = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        return {
            totalCost,
            grossProfit,
            profitMargin,
            costPerSqMeter,
            roi,
            profitPerSqMeter, // Incluimos la nueva métrica
            expensesByCategory
        };
    }

    /**
     * Calcula las métricas financieras para todo el portafolio de proyectos.
     * @param {Array<object>} projects - Array de todos los proyectos.
     * @returns {Promise<object>} - Un objeto con las métricas del portafolio.
     */
    async calculatePortfolioMetrics(projects) {
        let totalInvestmentRealized = 0; // Inversión en proyectos cerrados
        let totalProfitRealized = 0; // Ganancia de proyectos cerrados
        let closedProjectsCount = 0;
        let totalProjectDurationDays = 0; // Para tiempo promedio de cierre
        let totalROIRealized = 0;
        let numProjectsWithROI = 0;
        let capitalEmployedActiveProjects = 0;
        let totalCapitalDeployed = 0; // Suma de costos de TODOS los proyectos

        const monthlyProfit = {}; // Para el gráfico de Ganancia Mensual

        // Nuevas estructuras para métricas por tipo de propiedad
        const profitMarginByType = {}; // { type: { totalProfit: X, totalSaleAmount: Y, count: Z } }
        const averageTimeToCloseByType = {}; // { type: { totalDays: X, count: Z } }
        const projectDistributionByType = {}; // { type: count }

        for (const project of projects) {
            const expenses = await this.db.getDocumentsByField('expenses', 'projectId', project.id);
            const projectCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);

            totalCapitalDeployed += projectCost; // Suma el costo de TODOS los proyectos

            // Actualizar distribución de proyectos por tipo
            projectDistributionByType[project.type] = (projectDistributionByType[project.type] || 0) + 1;

            if (project.isClosed) {
                closedProjectsCount++;
                totalInvestmentRealized += projectCost;
                
                if (project.saleAmount) {
                    const profit = project.saleAmount - projectCost;
                    totalProfitRealized += profit;

                    // Calcular duración del proyecto
                    if (project.createdAt && project.saleDate) {
                        const createdDate = new Date(project.createdAt);
                        const saleDate = new Date(project.saleDate);
                        const diffTime = Math.abs(saleDate - createdDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        totalProjectDurationDays += diffDays;

                        // Tiempo de cierre por tipo de propiedad
                        averageTimeToCloseByType[project.type] = averageTimeToCloseByType[project.type] || { totalDays: 0, count: 0 };
                        averageTimeToCloseByType[project.type].totalDays += diffDays;
                        averageTimeToCloseByType[project.type].count++;
                    }

                    // Calcular ROI individual para el promedio del portafolio
                    if (projectCost > 0) {
                        totalROIRealized += (profit / projectCost);
                        numProjectsWithROI++;
                    }

                    // Acumular ganancia mensual para el gráfico
                    const saleMonth = new Date(project.saleDate).toLocaleString('es-CO', { year: 'numeric', month: 'short' });
                    monthlyProfit[saleMonth] = (monthlyProfit[saleMonth] || 0) + profit;

                    // Acumular datos para margen de ganancia por tipo de propiedad
                    profitMarginByType[project.type] = profitMarginByType[project.type] || { totalProfit: 0, totalSaleAmount: 0, count: 0 };
                    profitMarginByType[project.type].totalProfit += profit;
                    profitMarginByType[project.type].totalSaleAmount += project.saleAmount;
                    profitMarginByType[project.type].count++;
                }
            } else {
                // Capital empleado en proyectos activos
                capitalEmployedActiveProjects += projectCost;
            }
        }

        const portfolioProfitMargin = totalInvestmentRealized > 0 ? (totalProfitRealized / totalInvestmentRealized) * 100 : 0;
        const averageTimeToCloseProject = closedProjectsCount > 0 ? totalProjectDurationDays / closedProjectsCount : 0;
        const averageROI = numProjectsWithROI > 0 ? (totalROIRealized / numProjectsWithROI) * 100 : 0;
        const averageProfitPerProject = closedProjectsCount > 0 ? totalProfitRealized / closedProjectsCount : 0;

        // Calcular márgenes de ganancia finales por tipo
        const finalProfitMarginByType = {};
        for (const type in profitMarginByType) {
            const data = profitMarginByType[type];
            finalProfitMarginByType[type] = data.totalSaleAmount > 0 ? (data.totalProfit / data.totalSaleAmount) * 100 : 0;
        }

        // Calcular tiempos promedio de cierre finales por tipo
        const finalAverageTimeToCloseByType = {};
        for (const type in averageTimeToCloseByType) {
            const data = averageTimeToCloseByType[type];
            finalAverageTimeToCloseByType[type] = data.count > 0 ? data.totalDays / data.count : 0;
        }


        return {
            totalCapitalDeployed,
            totalInvestmentRealized,
            totalProfitRealized,
            closedProjectsCount,
            monthlyProfit,
            portfolioProfitMargin,
            averageTimeToCloseProject,
            averageROI,
            capitalEmployedActiveProjects,
            averageProfitPerProject,
            profitMarginByType: finalProfitMarginByType, // Nuevas métricas
            averageTimeToCloseByType: finalAverageTimeToCloseByType, // Nuevas métricas
            projectDistributionByType // Nueva métrica
        };
    }
}
