    // js/db.js
    
    // Importa la configuración desde el archivo separado
    import { firebaseConfig } from './firebaseConfig.js';
    
    // Inicializa Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    
    /**
     * Clase que gestiona todas las operaciones con Firestore.
     * Esto aísla la lógica de la base de datos del resto de la aplicación.
     */
    export class DatabaseManager {
    
        /**
         * Obtiene todos los documentos de una colección.
         * @param {string} collectionName - El nombre de la colección.
         * @returns {Promise<Array>} - Una promesa que resuelve con un array de documentos.
         */
        async getAllDocuments(collectionName) {
            try {
                const snapshot = await db.collection(collectionName).get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Error al obtener documentos de la colección ${collectionName}:`, error);
                return [];
            }
        }
    
        /**
         * Obtiene un documento específico por su ID.
         * @param {string} collectionName - El nombre de la colección.
         * @param {string} docId - El ID del documento.
         * @returns {Promise<Object|null>} - El documento o null si no se encuentra.
         */
        async getDocument(collectionName, docId) {
            try {
                const docRef = db.collection(collectionName).doc(docId);
                const doc = await docRef.get();
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            } catch (error) {
                console.error(`Error al obtener el documento ${docId}:`, error);
                return null;
            }
        }
    
        /**
         * Añade un nuevo documento a una colección.
         * @param {string} collectionName - El nombre de la colección.
         * @param {object} data - Los datos a añadir.
         * @returns {Promise<string|null>} - El ID del nuevo documento o null en caso de error.
         */
        async addDocument(collectionName, data) {
            try {
                const docRef = await db.collection(collectionName).add(data);
                return docRef.id;
            } catch (error) {
                console.error(`Error al añadir documento en la colección ${collectionName}:`, error);
                return null;
            }
        }
    
        /**
         * Actualiza un documento existente.
         * @param {string} collectionName - El nombre de la colección.
         * @param {string} docId - El ID del documento.
         * @param {object} data - Los datos a actualizar.
         * @returns {Promise<void>}
         */
        async updateDocument(collectionName, docId, data) {
            try {
                const docRef = db.collection(collectionName).doc(docId);
                await docRef.update(data);
            } catch (error) {
                console.error(`Error al actualizar el documento ${docId}:`, error);
            }
        }
    
        /**
         * Elimina un documento de una colección.
         * @param {string} collectionName - El nombre de la colección.
         * @param {string} docId - El ID del documento a eliminar.
         * @returns {Promise<void>}
         */
        async deleteDocument(collectionName, docId) {
            try {
                await db.collection(collectionName).doc(docId).delete();
            } catch (error) {
                console.error(`Error al eliminar el documento ${docId}:`, error);
            }
        }
    
        /**
         * Obtiene los documentos de una colección que coincidan con un campo y un valor.
         * @param {string} collectionName - El nombre de la colección.
         * @param {string} field - El campo a filtrar.
         * @param {any} value - El valor del campo.
         * @returns {Promise<Array>} - Una promesa que resuelve con un array de documentos.
         */
        async getDocumentsByField(collectionName, field, value) {
            try {
                const querySnapshot = await db.collection(collectionName).where(field, '==', value).get();
                return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Error al filtrar documentos por el campo ${field}:`, error);
                return [];
            }
        }
    }
    