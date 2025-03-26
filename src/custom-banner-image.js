const PLUGIN_ID = 'custom-banner-image';
let ENTITY_ID;

const main = async () => {
    while (!document.querySelector('#root')) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }        

    const plugins = await makeRequest(configRequest);

    ENTITY_ID = plugins?.data?.configuration?.plugins?.[PLUGIN_ID]?.id;
    
    if (!ENTITY_ID) {
        console.error('No ID set for custom banner image plugin.');
        return;
    }

    // Observa cambios en la URL para detectar cuando estás en la página de un artista
    const observer = new MutationObserver(onPageNavigation);
    observer.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });

    // Llama manualmente a la función al cargar la página
    onPageNavigation();
};

/**
 * Handler para detectar navegación a la página de un artista y cambiar la imagen de fondo.
 */
const onPageNavigation = async () => {
    if (location.href.includes('/performers/')) {
        // Obtén el ID del artista desde la URL
        const performerId = location.href.split('/')[4]?.split('?')[0];

        // Realiza la solicitud para obtener la imagen específica del artista
        const images = await makeRequest(imageRequest(performerId));
        const performerBackgroundImage = images?.data?.findImages?.images?.[0]?.paths?.image;

        // Cambia la imagen de fondo si se encuentra
        if (performerBackgroundImage) {
            setBackground(performerBackgroundImage);
        }
    }
};

/**
 * Cambia la imagen de fondo estableciendo una variable CSS.
 * @param {string|null} img 
 */
const setBackground = (img) => {
    const backgroundElement = document.querySelector('.background-image');
    if (backgroundElement) {
        backgroundElement.style.backgroundImage = `url(${img || ''})`;
    }
};

/**
 * Realiza una solicitud GraphQL.
 * @param {object} request 
 */
const makeRequest = async (request) => {
    const response = await fetch(`${window.location.origin}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        body: JSON.stringify(request)
    });

    return response.json();
};

/**
 * Genera la solicitud para obtener imágenes.
 * @param {string} performerId 
 */
const imageRequest = (performerId) => {
    const query = `
    query FindImages($filter: FindFilterType, $image_filter: ImageFilterType) {
      findImages(filter: $filter, image_filter: $image_filter) {
        images {
          id
          paths {
            image
          }
        } 
      }
    }
  `;

    return {
        operationName: 'FindImages',
        query,
        variables: {
            filter: {
                direction: 'ASC',
                page: 1,
                per_page: 1,
                sort: "random"
            },
            image_filter: {
                performers: {
                    value: [performerId],
                    modifier: 'INCLUDES_ALL'
                },
                galleries: {
                    value: [ENTITY_ID],
                    modifier: 'INCLUDES_ALL'
                }
            }
        }
    };
};

const configRequest = {
  operationName: "Configuration",
  variables: {},
  query: `
    query Configuration {
      configuration {
        plugins
      }
    }`,
};

main();