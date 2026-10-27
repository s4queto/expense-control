package com.saqueto.controle_gastos.controller;

import com.saqueto.controle_gastos.dto.LoginResposta;
import com.saqueto.controle_gastos.model.Usuario;
import com.saqueto.controle_gastos.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Void> cadastrar(@RequestBody Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        usuario.setId(null);
        usuario.setToken(null);
        usuario.setSenha(encoder.encode(usuario.getSenha()));
        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED).build();
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
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(new
                LoginResposta(usuario.getToken(), usuario.getNome(), usuario.getIdioma()));

    }
}
