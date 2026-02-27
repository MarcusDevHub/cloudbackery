// src/App.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import './App.css';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('pdv');
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);

  // Estados dos formulários
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', qtd: '' });
  const [novaVenda, setNovaVenda] = useState({ produtoId: '', qtd: 1, pagamento: 'Dinheiro' });

  // Buscar dados em TEMPO REAL (Se outro usuário mudar, atualiza aqui na hora)
  useEffect(() => {
    const unsubProdutos = onSnapshot(collection(db, 'produtos'), (snapshot) => {
      setProdutos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qVendas = query(collection(db, 'vendas'), orderBy('data', 'desc'));
    const unsubVendas = onSnapshot(qVendas, (snapshot) => {
      setVendas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProdutos(); unsubVendas(); };
  }, []);

  // --- FUNÇÕES DE ESTOQUE ---
  const adicionarProduto = async () => {
    if (!novoProd.nome || !novoProd.preco || !novoProd.qtd) return alert("Preencha tudo!");
    await addDoc(collection(db, 'produtos'), {
      nome: novoProd.nome,
      preco: parseFloat(novoProd.preco),
      qtd: parseInt(novoProd.qtd)
    });
    setNovoProd({ nome: '', preco: '', qtd: '' });
    alert("Produto salvo na nuvem!");
  };

  // --- FUNÇÕES DE VENDA ---
  const registrarVenda = async () => {
    const produto = produtos.find(p => p.id === novaVenda.produtoId);
    if (!produto || novaVenda.qtd <= 0) return alert("Selecione um produto e quantidade.");
    if (produto.qtd < novaVenda.qtd) return alert("Estoque insuficiente!");

    const total = produto.preco * novaVenda.qtd;

    // 1. Atualiza o estoque na nuvem
    const prodRef = doc(db, 'produtos', produto.id);
    await updateDoc(prodRef, { qtd: produto.qtd - novaVenda.qtd });

    // 2. Registra a venda
    await addDoc(collection(db, 'vendas'), {
      produtoNome: produto.nome,
      qtd: parseInt(novaVenda.qtd),
      total: total,
      pagamento: novaVenda.pagamento,
      data: new Date().toISOString()
    });

    setNovaVenda({ ...novaVenda, qtd: 1 });
    alert(`Venda registrada! R$ ${total.toFixed(2)}`);
  };

  // --- CÁLCULO DE RESUMO ---
  const faturamentoTotal = vendas.reduce((acc, v) => acc + v.total, 0);
  const produtosBaixos = produtos.filter(p => p.qtd < 10);

  return (
    <div className="app-container">
      <header>🍞 Pão & Cia Cloud</header>

      <main>
        {/* TELA 1: PDV */}
        {abaAtiva === 'pdv' && (
          <div className="section">
            <h2>Nova Venda</h2>
            <div className="form-group">
              <label>Produto</label>
              <select onChange={e => setNovaVenda({ ...novaVenda, produtoId: e.target.value })} value={novaVenda.produtoId}>
                <option value="">Selecione...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco.toFixed(2)} (Est: {p.qtd})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantidade</label>
              <input type="number" min="1" value={novaVenda.qtd} onChange={e => setNovaVenda({ ...novaVenda, qtd: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Pagamento</label>
              <select value={novaVenda.pagamento} onChange={e => setNovaVenda({ ...novaVenda, pagamento: e.target.value })}>
                <option value="Dinheiro">💵 Dinheiro</option>
                <option value="PIX">📱 PIX</option>
                <option value="Cartão">💳 Cartão</option>
              </select>
            </div>
            <button className="btn-primary" onClick={registrarVenda}>Finalizar Venda</button>
          </div>
        )}

        {/* TELA 2: ESTOQUE */}
        {abaAtiva === 'estoque' && (
          <div className="section">
            <h2>Novo Produto</h2>
            <input className="input-box" placeholder="Nome (Ex: Pão Doce)" value={novoProd.nome} onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })} />
            <input className="input-box" type="number" placeholder="Preço (Ex: 1.50)" value={novoProd.preco} onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })} />
            <input className="input-box" type="number" placeholder="Quantidade inicial" value={novoProd.qtd} onChange={e => setNovoProd({ ...novoProd, qtd: e.target.value })} />
            <button className="btn-primary" onClick={adicionarProduto}>Salvar no Banco</button>

            <h3 style={{ marginTop: '20px' }}>Estoque em Tempo Real</h3>
            {produtos.map(p => (
              <div key={p.id} className="card">
                <h4>{p.nome}</h4>
                <p>R$ {p.preco.toFixed(2)} | <span className={p.qtd < 10 ? 'badge-red' : 'badge-green'}>Estoque: {p.qtd}</span></p>
              </div>
            ))}
          </div>
        )}

        {/* TELA 3: HISTÓRICO */}
        {abaAtiva === 'historico' && (
          <div className="section">
            <h2>Histórico Global</h2>
            {vendas.map(v => (
              <div key={v.id} className="card">
                <h4>{v.qtd}x {v.produtoNome}</h4>
                <p>Total: <b>R$ {v.total.toFixed(2)}</b> | Pago via {v.pagamento}</p>
                <small>{new Date(v.data).toLocaleString('pt-BR')}</small>
              </div>
            ))}
          </div>
        )}

        {/* TELA 4: RESUMO */}
        {abaAtiva === 'resumo' && (
          <div className="section">
            <h2>Resumo da Loja</h2>
            <div className="card resumo-card">
              <h3>Faturamento</h3>
              <h1>R$ {faturamentoTotal.toFixed(2)}</h1>
            </div>

            <h3 style={{ marginTop: '20px' }}>Alertas (Estoque Abaixo de 10)</h3>
            {produtosBaixos.map(p => (
              <div key={p.id} className="card alerta">
                Faltam apenas {p.qtd} unidades de <b>{p.nome}</b>!
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NAVEGAÇÃO MOBILE */}
      <nav className="bottom-nav">
        {['pdv', 'estoque', 'historico', 'resumo'].map(aba => (
          <div key={aba} className={`nav-item ${abaAtiva === aba ? 'active' : ''}`} onClick={() => setAbaAtiva(aba)}>
            {aba === 'pdv' && '🛒 PDV'}
            {aba === 'estoque' && '📦 Estoque'}
            {aba === 'historico' && '🧾 Vendas'}
            {aba === 'resumo' && '📊 Resumo'}
          </div>
        ))}
      </nav>
    </div>
  );
}