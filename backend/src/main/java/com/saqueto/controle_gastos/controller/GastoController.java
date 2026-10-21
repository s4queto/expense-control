package com.saqueto.controle_gastos.controller;

import com.saqueto.controle_gastos.model.Gasto;
import com.saqueto.controle_gastos.repository.GastoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/gastos")
public class GastoController {


private final GastoRepository gastoRepository;

public GastoController(GastoRepository gastoRepository) {
    this.gastoRepository = gastoRepository;
}

@GetMapping
public List<Gasto> listar() {
    return gastoRepository.findAll();
 }

 @GetMapping("/{id}")
public ResponseEntity<Gasto> buscarPorId(@PathVariable Long id) {
     Optional<Gasto> gasto = gastoRepository.findById(id);

     if (gasto.isPresent()) {
         return ResponseEntity.ok(gasto.get());
     }
     return  ResponseEntity.notFound().build();
 }

 @PostMapping
    public Gasto salvar(@RequestBody Gasto gasto) {
     return gastoRepository.save(gasto);
 }

 @PutMapping("/{id}")
 public Gasto atualizar(@PathVariable Long id, @RequestBody Gasto gasto) {
    gasto.setId(id);
    return gastoRepository.save(gasto);
 }

 @DeleteMapping("/{id}")
    public void apagar(@PathVariable Long id) {
    gastoRepository.deleteById(id);
 }
}