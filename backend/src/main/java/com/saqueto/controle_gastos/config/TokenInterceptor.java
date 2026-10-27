package com.saqueto.controle_gastos.config;

import com.saqueto.controle_gastos.model.Usuario;
import com.saqueto.controle_gastos.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

@Component
public class TokenInterceptor implements HandlerInterceptor {
    private final UsuarioRepository usuarioRepository;

    public TokenInterceptor(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (request.getMethod().equals("OPTIONS")) {
            return true;
        }

        String cabecalho = request.getHeader("Authorization");

        if (cabecalho == null || !cabecalho.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }

        String token = cabecalho.substring(7);
        Optional<Usuario> usuario = usuarioRepository.findByToken(token);

        if (usuario.isEmpty()) {
            response.setStatus(401);
            return false;
        }

        request.setAttribute("usuario", usuario.get());
        return true;
    }
}
