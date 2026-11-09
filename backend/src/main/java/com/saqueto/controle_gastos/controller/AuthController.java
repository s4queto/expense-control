package com.saqueto.controle_gastos.controller;

import com.saqueto.controle_gastos.dto.CadastroPedido;
import com.saqueto.controle_gastos.dto.LoginResposta;
import com.saqueto.controle_gastos.model.Usuario;
import com.saqueto.controle_gastos.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@CrossOrigin


public class AuthController {
    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UsuarioRepository usuariorepository) {
        this.usuarioRepository = usuariorepository;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<Void> cadastrar(@RequestBody CadastroPedido pedido) {
        if (pedidoInvalido(pedido)) {
            return ResponseEntity.badRequest().build();
        }
        if (usuarioRepository.existsByEmail(pedido.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        Usuario usuario = new Usuario();
        usuario.setNome(pedido.nome());
        usuario.setEmail(pedido.email());
        usuario.setIdioma(pedido.idioma());
        usuario.setSenha(encoder.encode(pedido.senha()));
        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private boolean pedidoInvalido(CadastroPedido pedido) {
        if (pedido.nome() == null || pedido.nome().isBlank() || pedido.nome().length() > 100) {
            return true;
        }
        if (pedido.email() == null || !pedido.email().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            return true;
        }
        if (pedido.senha() == null || pedido.senha().length() < 6 || pedido.senha().length() > 72) {
            return true;
        }
        return false;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResposta> entrar(@RequestBody Usuario dados) {
        Optional<Usuario> encontrado =
                usuarioRepository.findByEmail(dados.getEmail());

        if (encontrado.isEmpty()) {
            return
                    ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Usuario usuario = encontrado.get();

        if (!encoder.matches(dados.getSenha(), usuario.getSenha())) {
            return
                    ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        usuario.setToken(UUID.randomUUID().toString());
        usuario.setTokenCriadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(new
                LoginResposta(usuario.getToken(), usuario.getNome(), usuario.getIdioma()));

    }

    @PostMapping("/sair")
    public ResponseEntity<Void> sair(@RequestAttribute("usuario") Usuario usuario) {
        usuario.setToken(null);
        usuario.setTokenCriadoEm(null);
        usuarioRepository.save(usuario);

        return ResponseEntity.noContent().build();
    }
}
