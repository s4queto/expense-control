package com.saqueto.controle_gastos.repository;

import com.saqueto.controle_gastos.model.Gasto;
import com.saqueto.controle_gastos.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GastoRepository extends JpaRepository<Gasto, Long> {

    List<Gasto> findByUsuario(Usuario usuario);

    Optional<Gasto> findByIdAndUsuario(Long id, Usuario usuario);

}
