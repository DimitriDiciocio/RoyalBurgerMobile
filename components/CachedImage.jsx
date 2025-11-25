import React, { useState, useRef } from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function CachedImage({
    source,
    style,
    resizeMode = 'cover',
    fallbackSource = null,
    ...props
}) {
    // ALTERAÇÃO: Estado para controlar se a imagem falhou ao carregar
    const [hasError, setHasError] = useState(false);
    // ALTERAÇÃO: Ref para evitar logs repetidos da mesma imagem
    const errorLoggedRef = useRef(false);

    // Se for uma URI, remove o timestamp para permitir cache
    const getCachedSource = (imageSource) => {
        if (imageSource && imageSource.uri) {
            // Remove o parâmetro ?t=timestamp se existir
            const uri = imageSource.uri.split('?')[0];
            return { uri };
        }
        return imageSource;
    };

    const cachedSource = getCachedSource(source);

    // ALTERAÇÃO: Handler de erro melhorado - evita logs repetidos e mostra placeholder
    const handleError = () => {
        if (!errorLoggedRef.current) {
            // ALTERAÇÃO: Log apenas em desenvolvimento e apenas uma vez por imagem
            const isDev = __DEV__;
            if (isDev) {
                console.log('Erro ao carregar imagem:', cachedSource?.uri);
            }
            errorLoggedRef.current = true;
        }
        setHasError(true);
    };

    // ALTERAÇÃO: Resetar estado de erro quando a source mudar
    React.useEffect(() => {
        setHasError(false);
        errorLoggedRef.current = false;
    }, [source?.uri]);

    // ALTERAÇÃO: Se houver erro e não houver fallback, mostrar placeholder
    if (hasError && !fallbackSource) {
        return (
            <View style={[styles.container, styles.placeholder, style]}>
                <View style={styles.placeholderContent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <Image
                source={hasError && fallbackSource ? fallbackSource : cachedSource}
                style={[styles.image, style]}
                resizeMode={resizeMode}
                onError={handleError}
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#D9D9D9',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    // ALTERAÇÃO: Estilos para placeholder quando imagem falha
    placeholder: {
        backgroundColor: '#D9D9D9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContent: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E0E0',
    },
});
