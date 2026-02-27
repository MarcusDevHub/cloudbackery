# ☁️ CloudBackery

Aplicação web para gerenciamento de uma padaria, desenvolvida com **React**, **Vite** e **Firebase Firestore**. Permite o cadastro, listagem e gerenciamento de produtos diretamente na nuvem, com interface simples e responsiva.

---

## 🚀 Tecnologias Utilizadas

- [React 19](https://react.dev/) — Biblioteca para construção de interfaces
- [Vite 7](https://vitejs.dev/) — Ferramenta de build e servidor de desenvolvimento ultrarrápido
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — Banco de dados NoSQL em tempo real na nuvem
- [ESLint](https://eslint.org/) — Linting e padronização de código

---

## 📁 Estrutura do Projeto

cloudbackery/
├── public/ # Arquivos públicos estáticos
├── src/
│ ├── assets/ # Imagens e recursos estáticos
│ ├── App.jsx # Componente principal da aplicação
│ ├── App.css # Estilos do componente principal
│ ├── firebaseConfig.js # Configuração e inicialização do Firebase
│ ├── index.css # Estilos globais
│ └── main.jsx # Ponto de entrada da aplicação React
├── index.html # HTML base da aplicação
├── package.json # Dependências e scripts do projeto
├── vite.config.js # Configuração do Vite
└── eslint.config.js # Configuração do ESLint

text

---

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- [npm](https://www.npmjs.com/) (já incluído com o Node.js)
- Uma conta no [Firebase](https://firebase.google.com/) com um projeto criado

---

## 🔧 Configuração do Firebase

O projeto usa o Firebase Firestore como banco de dados. O arquivo `src/firebaseConfig.js` já contém as credenciais do projeto `backery-web-app`. Caso queira usar seu próprio projeto Firebase:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **Configurações do projeto > Seus aplicativos > Web**
4. Copie as credenciais geradas
5. Substitua o conteúdo de `src/firebaseConfig.js`:

```js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
▶️ Como Rodar o Projeto
1. Clone o repositório
bash
git clone https://github.com/MarcusDevHub/cloudbackery.git
cd cloudbackery
2. Instale as dependências
bash
npm install
3. Inicie o servidor de desenvolvimento
bash
npm run dev
A aplicação estará disponível em: http://localhost:5173

📦 Scripts Disponíveis
Comando	Descrição
npm run dev	Inicia o servidor de desenvolvimento com HMR
npm run build	Gera o build de produção na pasta dist/
npm run preview	Visualiza o build de produção localmente
npm run lint	Executa o ESLint para verificar o código
☁️ Deploy
Para fazer o deploy da aplicação, execute:

bash
npm run build
A pasta dist/ gerada pode ser hospedada em plataformas como:

Vercel

Netlify

Firebase Hosting
👨‍💻 Autor
Desenvolvido por MarcusDevHub

