import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://gomeslab.tech/keycloak',
  realm: 'master',
  clientId: 'carteira'
});

export default keycloak;
