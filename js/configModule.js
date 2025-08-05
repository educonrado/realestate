// js/configModule.js

/**
 * Módulo para la lógica de configuración (ej. categorías).
 */
export class ConfigModule { // Asegúrate de que esta clase esté exportada
    /**
     * @param {DatabaseManager} db - Instancia del gestor de la base de datos.
     * @param {UIManager} ui - Instancia del gestor de la interfaz de usuario.
     */
    constructor(db, ui) {
        this.db = db;
        this.ui = ui;
    }

    /**
     * Asegura que exista al menos una categoría por defecto en la base de datos.
     */
    async ensureDefaultCategories() {
        try {
            const categories = await this.db.getAllDocuments('categories');
            if (categories.length === 0) {
                await this.db.addDocument('categories', { name: 'Mano de Obra' });
                await this.db.addDocument('categories', { name: 'Materiales' });
                await this.db.addDocument('categories', { name: 'Servicios' });
                console.log("Categorías por defecto creadas.");
            }
        } catch (error) {
            console.error("Error al asegurar categorías por defecto:", error);
        }
    }

    /**
     * Añade una nueva categoría de gasto.
     * @param {string} categoryName - El nombre de la nueva categoría.
     */
    async handleAddCategory(categoryName) {
        try {
            await this.db.addDocument('categories', { name: categoryName });
            // CAMBIO AQUÍ: Llamar a navigateTo para recargar la vista de configuración
            this.ui.navigateTo('nav-config');
            console.log("Categoría añadida exitosamente."); // Log para confirmar
        } catch (error) {
            console.error("Error al añadir categoría:", error);
            // ui.showError('Error al añadir la categoría.');
        }
    }

    /**
     * Elimina una categoría si no tiene gastos asociados.
     * @param {string} categoryId - El ID de la categoría a eliminar.
     */
    async handleDeleteCategory(categoryId) {
        try {
            // Verificar si hay gastos que usan esta categoría antes de eliminarla
            const categoryToDelete = await this.db.getDocument('categories', categoryId);
            if (!categoryToDelete) {
                console.warn("Categoría no encontrada para eliminar:", categoryId);
                return;
            }
            const expensesUsingCategory = await this.db.getDocumentsByField('expenses', 'category', categoryToDelete.name);
            
            if (expensesUsingCategory.length > 0) {
                console.warn("No se puede eliminar la categoría con gastos asociados.");
                // Aquí podrías usar una notificación más amigable si tu UI la soporta
                // this.ui.showError('No se puede eliminar una categoría con gastos asociados.');
                return;
            }
            await this.db.deleteDocument('categories', categoryId);
            // CAMBIO AQUÍ: Llamar a navigateTo para recargar la vista de configuración
            this.ui.navigateTo('nav-config');
            console.log("Categoría eliminada exitosamente."); // Log para confirmar
        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            // ui.showError('Error al eliminar la categoría.');
        }
    }
}
