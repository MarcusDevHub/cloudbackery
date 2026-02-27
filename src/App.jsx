// src/App.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import './App.css';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('pdv');
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);

  // Estados
  const [novoProd, setNovoProd] = useState({ nome: '', preco: '', qtd: '', tipo: 'Unidade' });
  const [novaVenda, setNovaVenda] = useState({ produtoId: '', qtd: '', pagamento: 'Dinheiro' });
  const [carrinho, setCarrinho] = useState([]);

  // Buscar dados em TEMPO REAL
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
    if (!novoProd.nome || !novoProd.preco || !novoProd.qtd) return alert("Preencha todos os campos!");
    await addDoc(collection(db, 'produtos'), {
      nome: novoProd.nome,
      preco: parseFloat(novoProd.preco),
      qtd: parseFloat(novoProd.qtd),
      tipo: novoProd.tipo
    });
    setNovoProd({ nome: '', preco: '', qtd: '', tipo: 'Unidade' });
    alert("Produto salvo no estoque!");
  };

  const excluirProduto = async (id, nomeProduto) => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir "${nomeProduto}" do estoque?`);
    if (confirmacao) {
      await deleteDoc(doc(db, 'produtos', id));
    }
  };

  // --- FUNÇÕES DE VENDA ---
  const adicionarAoCarrinho = () => {
    const produto = produtos.find(p => p.id === novaVenda.produtoId);
    const qtdVenda = parseFloat(novaVenda.qtd);

    if (!produto || isNaN(qtdVenda) || qtdVenda <= 0) return alert("Selecione um produto e uma quantidade válida.");

    const qtdJaNoCarrinho = carrinho.filter(i => i.produtoId === produto.id).reduce((acc, i) => acc + i.qtd, 0);

    if (produto.qtd < (qtdVenda + qtdJaNoCarrinho)) {
      return alert(`Estoque insuficiente! Restam apenas ${produto.qtd} ${produto.tipo === 'Kg' ? 'Kg' : 'unidades'}.`);
    }

    const subtotal = produto.preco * qtdVenda;

    const itemCarrinho = {
      idUnico: Date.now(),
      produtoId: produto.id,
      nome: produto.nome,
      qtd: qtdVenda,
      tipo: produto.tipo,
      preco: produto.preco,
      subtotal: subtotal
    };

    setCarrinho([...carrinho, itemCarrinho]);
    setNovaVenda({ ...novaVenda, produtoId: '', qtd: '' });
  };

  const removerDoCarrinho = (idUnico) => {
    setCarrinho(carrinho.filter(item => item.idUnico !== idUnico));
  };

  const finalizarCompra = async () => {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");

    const totalVenda = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

    // Baixa no estoque
    for (const item of carrinho) {
      const produtoNoBanco = produtos.find(p => p.id === item.produtoId);
      if (produtoNoBanco) {
        const prodRef = doc(db, 'produtos', produtoNoBanco.id);
        await updateDoc(prodRef, { qtd: produtoNoBanco.qtd - item.qtd });
      }
    }

    // Registra Venda
    await addDoc(collection(db, 'vendas'), {
      itens: carrinho,
      total: totalVenda,
      pagamento: novaVenda.pagamento,
      data: new Date().toISOString()
    });

    setCarrinho([]);
    setNovaVenda({ ...novaVenda, pagamento: 'Dinheiro' });
    alert(`Compra Finalizada com Sucesso!\nTotal Recebido: R$ ${totalVenda.toFixed(2)}`);
  };

  // NOVA FUNÇÃO: Excluir Venda e Restaurar Estoque
  const excluirVenda = async (venda) => {
    const confirmacao = window.confirm(`Deseja cancelar esta venda de R$ ${venda.total.toFixed(2)}?\n\nOs produtos vendidos voltarão para o estoque automaticamente.`);

    if (confirmacao) {
      // 1. Devolve os itens para o estoque
      if (venda.itens) {
        for (const item of venda.itens) {
          const produtoNoBanco = produtos.find(p => p.id === item.produtoId);
          if (produtoNoBanco) {
            const prodRef = doc(db, 'produtos', produtoNoBanco.id);
            // Soma a quantidade de volta ao estoque atual
            await updateDoc(prodRef, { qtd: produtoNoBanco.qtd + item.qtd });
          }
        }
      } else if (venda.produtoNome) {
        // Fallback para vendas muito antigas (antes de termos o carrinho)
        const produtoNoBanco = produtos.find(p => p.nome === venda.produtoNome);
        if (produtoNoBanco) {
          const prodRef = doc(db, 'produtos', produtoNoBanco.id);
          await updateDoc(prodRef, { qtd: produtoNoBanco.qtd + venda.qtd });
        }
      }

      // 2. Apaga o registro da venda
      await deleteDoc(doc(db, 'vendas', venda.id));
      alert("Venda cancelada e estoque restaurado!");
    }
  };

  // --- VARIÁVEIS DE CÁLCULO ---
  const faturamentoTotal = vendas.reduce((acc, v) => acc + (v.total || 0), 0);
  const produtosBaixos = produtos.filter(p => p.qtd < (p.tipo === 'Kg' ? 2 : 10));
  const totalDoCarrinho = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  const produtoSelecionado = produtos.find(p => p.id === novaVenda.produtoId);
  const valorTotalParcial = produtoSelecionado && parseFloat(novaVenda.qtd) > 0
    ? (produtoSelecionado.preco * parseFloat(novaVenda.qtd)).toFixed(2)
    : "0.00";

  return (
    <div className="app-container">
      <header>🍞 Pão & Cia Cloud</header>

      <main>
        {/* TELA 1: PDV */}
        {abaAtiva === 'pdv' && (
          <div className="section">
            <h2>Ponto de Venda</h2>

            <div className="card" style={{ borderLeftColor: '#3498db' }}>
              <div className="form-group">
                <label>Adicionar Produto</label>
                <select onChange={e => setNovaVenda({ ...novaVenda, produtoId: e.target.value, qtd: '' })} value={novaVenda.produtoId}>
                  <option value="">Selecione...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome} - R$ {p.preco.toFixed(2)} {p.tipo === 'Kg' ? 'o Kg' : 'a un.'}
                    </option>
                  ))}
                </select>
              </div>

              {produtoSelecionado && (
                <div className="form-group">
                  <label>{produtoSelecionado.tipo === 'Kg' ? 'Peso (Ex: 0.450)' : 'Quantidade (Unid)'}</label>
                  <input
                    type="number"
                    step={produtoSelecionado.tipo === 'Kg' ? "0.001" : "1"}
                    min="0"
                    value={novaVenda.qtd}
                    onChange={e => setNovaVenda({ ...novaVenda, qtd: e.target.value })}
                  />
                </div>
              )}

              {produtoSelecionado && parseFloat(novaVenda.qtd) > 0 && (
                <p style={{ fontWeight: 'bold', color: '#27ae60', marginBottom: '10px' }}>
                  Subtotal: R$ {valorTotalParcial}
                </p>
              )}

              <button className="btn-primary" style={{ backgroundColor: '#3498db' }} onClick={adicionarAoCarrinho}>
                + Adicionar ao Carrinho
              </button>
            </div>

            {carrinho.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ color: '#555', marginBottom: '10px' }}>🛒 Carrinho Atual</h3>
                {carrinho.map(item => (
                  <div key={item.idUnico} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{item.nome}</p>
                      <p style={{ fontSize: '0.85rem' }}>{item.qtd} {item.tipo === 'Kg' ? 'Kg' : 'unid.'} x R$ {item.preco.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <p style={{ fontWeight: 'bold', color: '#27ae60' }}>R$ {item.subtotal.toFixed(2)}</p>
                      <button onClick={() => removerDoCarrinho(item.idUnico)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '1.2rem', cursor: 'pointer' }}>❌</button>
                    </div>
                  </div>
                ))}

                <div className="card resumo-card" style={{ margin: '15px 0' }}>
                  <p>Total a Cobrar:</p>
                  <h2>R$ {totalDoCarrinho.toFixed(2)}</h2>
                </div>

                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select value={novaVenda.pagamento} onChange={e => setNovaVenda({ ...novaVenda, pagamento: e.target.value })}>
                    <option value="Dinheiro">💵 Dinheiro</option>
                    <option value="PIX">📱 PIX</option>
                    <option value="Cartão">💳 Cartão</option>
                  </select>
                </div>

                <button className="btn-primary" onClick={finalizarCompra}>✅ Concluir Venda Completa</button>
              </div>
            )}
          </div>
        )}

        {/* TELA 2: ESTOQUE */}
        {abaAtiva === 'estoque' && (
          <div className="section">
            <h2>Novo Produto</h2>
            <input className="input-box" placeholder="Nome (Ex: Pão Francês)" value={novoProd.nome} onChange={e => setNovoProd({ ...novoProd, nome: e.target.value })} />
            <select className="input-box" value={novoProd.tipo} onChange={e => setNovoProd({ ...novoProd, tipo: e.target.value })}>
              <option value="Unidade">Vendido por Unidade</option>
              <option value="Kg">Vendido por Peso (Kg)</option>
            </select>
            <input className="input-box" type="number" step="0.01" placeholder="Preço (R$)" value={novoProd.preco} onChange={e => setNovoProd({ ...novoProd, preco: e.target.value })} />
            <input className="input-box" type="number" step={novoProd.tipo === 'Kg' ? "0.001" : "1"} placeholder={`Quantidade Inicial (${novoProd.tipo})`} value={novoProd.qtd} onChange={e => setNovoProd({ ...novoProd, qtd: e.target.value })} />
            <button className="btn-primary" onClick={adicionarProduto}>Salvar no Banco</button>

            <h3 style={{ marginTop: '20px' }}>Estoque em Tempo Real</h3>
            {produtos.map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{p.nome}</h4>
                  <p>R$ {p.preco.toFixed(2)} {p.tipo === 'Kg' ? 'o Kg' : 'a un.'} | <span className={p.qtd < (p.tipo === 'Kg' ? 2 : 10) ? 'badge-red' : 'badge-green'}>Estoque: {p.qtd} {p.tipo === 'Kg' ? 'Kg' : 'unidades'}</span></p>
                </div>
                <button onClick={() => excluirProduto(p.id, p.nome)} style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }} title="Excluir Produto">🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* TELA 3: HISTÓRICO COM BOTÃO DE EXCLUIR */}
        {abaAtiva === 'historico' && (
          <div className="section">
            <h2>Histórico Global</h2>
            {vendas.length === 0 && <p>Nenhuma venda registrada ainda.</p>}

            {vendas.map(v => (
              <div key={v.id} className="card" style={{ paddingBottom: '5px' }}>

                {/* CABEÇALHO DO CARD COM O BOTÃO DE LIXEIRA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <h4 style={{ color: '#27ae60', margin: 0 }}>R$ {v.total.toFixed(2)}</h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <small style={{ color: '#777' }}>{new Date(v.data).toLocaleString('pt-BR').substring(0, 16)}</small>
                    <button
                      onClick={() => excluirVenda(v)}
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                      title="Cancelar Venda"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* LISTA DE ITENS DA VENDA */}
                {v.itens ? (
                  v.itens.map((item, index) => (
                    <p key={index} style={{ fontSize: '0.9rem', color: '#555', margin: '2px 0' }}>
                      • {item.qtd} {item.tipo === 'Kg' ? 'Kg' : 'unid.'} de {item.nome}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: '0.9rem', color: '#555' }}>• {v.qtd} {v.tipo === 'Kg' ? 'Kg' : 'unid.'} de {v.produtoNome}</p>
                )}

                <p style={{ marginTop: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#d35400' }}>
                  Pago no {v.pagamento}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TELA 4: RESUMO */}
        {abaAtiva === 'resumo' && (
          <div className="section">
            <h2>Resumo da Loja</h2>
            <div className="card resumo-card">
              <h3>Faturamento Total</h3>
              <h1>R$ {faturamentoTotal.toFixed(2)}</h1>
            </div>

            <h3 style={{ marginTop: '20px' }}>Alertas de Estoque</h3>
            {produtosBaixos.length === 0 && <p>Tudo certo com o estoque!</p>}
            {produtosBaixos.map(p => (
              <div key={p.id} className="card alerta">
                Restam apenas {p.qtd} {p.tipo === 'Kg' ? 'Kg' : 'unidades'} de <b>{p.nome}</b>!
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