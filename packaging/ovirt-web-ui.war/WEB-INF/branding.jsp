<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page trimDirectiveWhitespaces="true" %>

<%@ page import="java.io.IOException" %>
<%@ page import="java.nio.file.Path" %>
<%@ page import="java.nio.file.Files" %>
<%@ page import="java.nio.file.DirectoryStream" %>
<%@ page import="java.util.Comparator" %>
<%@ page import="java.util.Optional" %>
<%@ page import="java.util.stream.StreamSupport" %>

<%@ page import="javax.servlet.http.HttpServlet" %>

<%@ page import="org.ovirt.engine.core.utils.EngineLocalConfig" %>

<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>

<%
    // This could be very well a servlet. We just want to avoid mead.
    //
    // public void _jspService(HttpServletRequest request, HttpServletResponse response) {
    final Path requestedFile = getRequestedPath(request);
    if (requestedFile == null) {
        returnNotFound(response);
        return;
    }
    try {
        sendFile(requestedFile, response);
    } catch (IOException ex) {
        log.error("Resource '{}' cannot be sent.", request.getRequestURI(), ex);
    }
%>



<%!
    private final Logger log = LoggerFactory.getLogger("branding.jsp");

    private Path resolveBrandingDirectory() {
        final Path brandingDir = getEtcWebUiBrandingDirectory();
        final DirectoryStream<Path> brandingsDirectoryStream;
        try {
            brandingsDirectoryStream = Files.newDirectoryStream(brandingDir, "*.brand");
        } catch (IOException ex) {
            log.error("Branding directory '{}' cannot be listed.", brandingDir, ex);
            return null;
        }
        final Comparator<Path> reversedPathComparator = new Comparator<Path>() {
            @Override
            public int compare(Path o1, Path o2) {
                return o1.compareTo(o2);
            }
        }.reversed();
        final Optional<Path> selectedBrandingOptional =
                StreamSupport.stream(brandingsDirectoryStream.spliterator(), false)
                        .sorted(reversedPathComparator)
                        .findFirst();
        final Path selectedBranding = selectedBrandingOptional.orElse(null);
        if (selectedBranding == null) {
            log.error("No web-ui branding found in directory '{}'.", brandingDir);
        }
        return selectedBranding;
    }

    private final Path resolvedBrandingDirectory = resolveBrandingDirectory();
    private static final String ETC_WEB_UI_DIR = "ovirt-web-ui";
    private static final String ETC_WEB_UI_BRANDING_DIR = "branding";

    /**
     * @return typically /etc/ovirt-web-ui/branding
     */
    private Path getEtcWebUiBrandingDirectory() {
        return EngineLocalConfig.getInstance().getEtcDir()
                .toPath()
                .getParent()
                .resolve(ETC_WEB_UI_DIR)
                .resolve(ETC_WEB_UI_BRANDING_DIR);
    }

    /**
     * @return path of requested file or null if path is invalid
     */
    private Path getRequestedPath(HttpServletRequest request) {
        if (resolvedBrandingDirectory == null) {
            log.error("No web-ui branding found in directory '{}'. Requesting resource '{}'",
                    getEtcWebUiBrandingDirectory(),
                    request.getRequestURI());
            return null;
        }
        final String relativePath = request.getPathInfo().substring(1);
        if (relativePath.contains("..")) {
            log.warn("Requested resources containing '..' in path: '{}'", request.getRequestURI());
            return null;
        }
        return resolvedBrandingDirectory.resolve(relativePath);
    }

    private void sendFile(Path path, HttpServletResponse response) throws IOException {
        response.setContentType(guessContentType(path));
        response.setContentLength((int) Files.size(path));
        Files.copy(path, response.getOutputStream());
    }

    private String guessContentType(Path path) {
        final String fileSuffix = getFileSuffix(path);
        switch (fileSuffix) {
            case "css":
                return "text/css";
            case "json":
                return "application/json";
            case "ico":
                return "image/x-icon";
            case "png":
                return "image/png";
        }
        return "application/octet-stream";
    }

    private String getFileSuffix(Path path) {
        final String[] fileNameParts = path.getFileName().toString().split("\\.");
        return fileNameParts[fileNameParts.length - 1];
    }

    private void returnNotFound(HttpServletResponse response) throws IOException {
        response.sendError(HttpServletResponse.SC_NOT_FOUND);
    }
%>
