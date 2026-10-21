package com.saqueto.controle_gastos.controller;

import com.saqueto.controle_gastos.model.Gasto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
public class OlaController {

    @GetMapping("/ola")
    public String dizerOla() {
        return "Olá! Meu controle de gastos está funcionando!";
    }

    @GetMapping("/gasto-exemplo")
    public Gasto mostrarGastoExemplo() {
        return new Gasto(1L, "Mercado", new BigDecimal("150.00"), LocalDate.now(), "Alimentação");
    }
}
