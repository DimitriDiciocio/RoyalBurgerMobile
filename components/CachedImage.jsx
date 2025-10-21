import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function CachedImage({
    source,
    style,
    resizeMode = 'cover',
    fallbackSource = null,
    ...props
}) {
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

    return (
        <View style={[styles.container, style]}>
            <Image
                source={cachedSource}
                style={[styles.image, style]}
                resizeMode={resizeMode}
                onError={() => {
                    console.log('Erro ao carregar imagem:', cachedSource?.uri);
                }}
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
});
