package com.saqueto.controle_gastos.repository;

import com.saqueto.controle_gastos.model.Gasto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GastoRepository  extends
        JpaRepository<Gasto, Long> {

}
