<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<!-- Passes through oVirt SSO and redirects while populating SSO token -->
<!-- Example:redirectUrl=https://engine.local/ovirt-engine/web-ui/authorizedRedirect.jsp?redirectUrl=https://192.168.122.101:9090/machines?token=TOKEN -->
<%
String redirectUrl = request.getParameter("redirectUrl");
if (redirectUrl != null) {
        redirectUrl = java.net.URLDecoder.decode(redirectUrl, "UTF-8");
        redirectUrl = redirectUrl.replace("__hash__", "#");
        redirectUrl = redirectUrl.replace("TOKEN", ((java.util.Map<String, String>)(request.getSession().getAttribute("userInfo"))).get("ssoToken"));
        response.sendRedirect(redirectUrl);
}
%>
<%= redirectUrl %>

