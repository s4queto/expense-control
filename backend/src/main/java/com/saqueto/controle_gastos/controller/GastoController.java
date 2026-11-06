package com.saqueto.controle_gastos.controller;

import com.saqueto.controle_gastos.model.Gasto;
import com.saqueto.controle_gastos.model.Usuario;
import com.saqueto.controle_gastos.repository.GastoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin
@RequestMapping("/gastos")
public class GastoController {


private final GastoRepository gastoRepository;

public GastoController(GastoRepository gastoRepository) {
    this.gastoRepository = gastoRepository;
}

@GetMapping
public List<Gasto> listar(@RequestAttribute("usuario") Usuario usuario) {
    return gastoRepository.findByUsuario(usuario);
 }

 @GetMapping("/{id}")
public ResponseEntity<Gasto> buscarPorId(@PathVariable Long id, @RequestAttribute("usuario") Usuario usuario) {
     Optional<Gasto> gasto = gastoRepository.findByIdAndUsuario(id, usuario);

     if (gasto.isPresent()) {
         return ResponseEntity.ok(gasto.get());
     }
     return  ResponseEntity.notFound().build();
 }

 @PostMapping
    public Gasto salvar(@RequestBody Gasto gasto, @RequestAttribute("usuario") Usuario usuario) {
     gasto.setId(null);
     gasto.setUsuario(usuario);
     return gastoRepository.save(gasto);
 }

 @PutMapping("/{id}")
 public ResponseEntity<Gasto> atualizar(@PathVariable Long id, @RequestBody Gasto gasto, @RequestAttribute("usuario") Usuario usuario) {
    if (gastoRepository.findByIdAndUsuario(id, usuario).isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    gasto.setId(id);
    gasto.setUsuario(usuario);
    return ResponseEntity.ok(gastoRepository.save(gasto));
 }

 @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable Long id, @RequestAttribute("usuario") Usuario usuario) {
    if (gastoRepository.findByIdAndUsuario(id, usuario).isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    gastoRepository.deleteById(id);
    return ResponseEntity.noContent().build();
 }
}