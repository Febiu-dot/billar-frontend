if (tipoFase === 'acumulado') {
        // Buscar el torneo del circuito seleccionado
        const todosCircuitos = torneos.flatMap((t: any) =>
          (t.circuits ?? []).map((c: any) => ({ ...c, torneoNombre: t.name, torneoYear: t.year, torneoId: t.id }))
        );
        const circuito = todosCircuitos.find((c: any) => c.id === Number(circuitId));
        if (!circuito) { setError('Circuito no encontrado.'); setLoading(false); return; }

        const acumRes = await api.get(`/acumulado/${circuito.torneoId}`);
        if (!acumRes.data || acumRes.data.length === 0) {
          setError('No hay ranking acumulado disponible aún. Se genera automáticamente al finalizar cada fase Máster.');
          setLoading(false);
          return;
        }

        const lastCircuitOrder = acumRes.data[0]?.lastCircuitOrder ?? 1;
        const circuitosIncluidos = acumRes.data[0]?.circuitosIncluidos ?? '';
        const jugadores = acumRes.data.map((e: any) => ({
          posicion: e.position ?? 0,
          nombre: `${e.player.lastName}, ${e.player.firstName}`,
          club: abrevClub(e.player.club),
          puntos: e.points,
          categoria: e.player?.category?.name ?? null,
          seccion: (e.position ?? 999) <= 8 ? 'MÁSTER' : (e.position ?? 999) <= 32 ? 'PRIMERA' : (e.position ?? 999) <= 64 ? 'SEGUNDA' : 'TERCERA',
        }));

        setPubData({
          tipo: 'ranking',
          tipoFase: 'acumulado',
          torneo: circuito.torneoNombre,
          circuito: circuitosIncluidos,
          temporada: String(circuito.torneoYear),
          fase: `RANKING ACUMULADO — LUEGO DEL CIRCUITO ${lastCircuitOrder}`,
          formato: '',
          fechaPrincipal: `Incluye: ${circuitosIncluidos}`,
          jugadores,
        });
        setNotas('');
        setLoading(false);
        return;
      }
